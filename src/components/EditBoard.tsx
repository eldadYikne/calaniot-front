import { useEffect, useRef, useState } from "react";
import {
  Board,
  Message,
  ScreenType,
  ScreenTypeTypes,
  ShabatDayTfila,
  ShabatTimesToEdit,
  Tfila,
  Theme,
} from "../types/board";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Modal,
  Snackbar,
  TextField,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "..";
import { Delete } from "@mui/icons-material";

import { DateToShow, dateToShow, translationsZmanimKeys } from "../utils/const";
import { TranslationsZmanimKeys, Zman } from "../types/zmanim";
import { UploadWidget } from "./UploadWidget";
import { generateRandomId } from "../utils/utils";
import { toPng } from "html-to-image";

function EditBoard(props: Props) {
  const [dbBoard, setDbBoard] = useState<Board>();
  const [snackbarIsOpen, setSnackbarIsOpen] = useState<boolean>();
  const [imageUrl, setImageUrl] = useState("");
  const [screenEditorIsOpen, setScreenEditorIsOpen] = useState<boolean>(false);
  const [downloadTimesImgIsOpen, setDownloadTimesImgIsOpen] =
    useState<boolean>(false);
  const [screenTypeEdit, setScreenTypeEdit] = useState<ScreenTypeTypes>();
  const [editingScreen, setEditingScreen] = useState<ScreenType>();
  const elementRef = useRef(null);

  const navigate = useNavigate();
  const { id } = useParams();
  useEffect(() => {
    async function fetchData() {
      if (id) {
        console.log("id", id);
        await getBoardById(id);
      }
    }
    fetchData();
  }, [id]);

  const getBoardById = async (boardId: string) => {
    try {
      const boardDoc = await getDoc(doc(db, "boards", boardId));
      if (boardDoc.exists()) {
        // Document exists, return its data along with the ID
        const newBoard = { ...boardDoc.data(), id: boardDoc.id };
        if (newBoard) {
          setDbBoard(newBoard as Board);
        }
        console.log(newBoard);
      } else {
        // Document does not exist
        console.log("User not found");
        return null;
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      throw error; // Rethrow the error to handle it where the function is called
    }
  };
  // const board: Board = {
  //   boardBackgroundImage: "",
  //   city: "",
  //   forMedicine: [""],
  //   forUplifting: [""],
  //   geoId: "",
  //   mapBackgroundImage: "",
  //   messages: [{ title: "", content: "", date: new Date() }],
  //   tfilaTimes: [{ isSaturdayTfila: true, name: "מנחה", time: "" }],
  //   theme: "regular",
  //   timeScreenPass: "",
  //   timesToShow: ["chatzot", "dusk"],
  //   users: [],
  // };
  const handleTimesChange = (time: keyof TranslationsZmanimKeys) => {
    let newArray;
    if (dbBoard?.timesToShow.includes(time)) {
      newArray = dbBoard?.timesToShow.filter((item) => item !== time);
    } else if (dbBoard?.timesToShow) {
      newArray = [...dbBoard?.timesToShow, time];
    }
    if (dbBoard?.timesToShow && newArray) {
      setDbBoard({
        ...dbBoard,
        timesToShow: newArray,
      });
    }
  };
  // DATA
  const dataKeysToHebrewName: { [key: string]: string } = {
    name: "שם",
    time: "זמן",
    content: "שם",
  };
  const screenTypes: ScreenType[] = [
    { type: "image", text: "תמונה", title: "", content: "", id: "" },
    {
      id: "",
      type: "message",
      text: "הודעה לציבור",
      title: "נא לא לדבר בשעת התפילה!",
      content: "",
    },
  ];
  const inputsBoard: { name: keyof Board; placeholder: string }[] = [
    { name: "boardName", placeholder: "שם בית כנסת" },
    { name: "geoId", placeholder: "איזור לעדכון זמן" },
    { name: "timeScreenPass", placeholder: "זמן מעבר בין מסכים" },
    { name: "screens", placeholder: "הוסף מסך" },
    { name: "tfilaTimes", placeholder: "זמני יום חול" },
    { name: "forUplifting", placeholder: "לעילוי נשמת" },
    { name: "dateTypes", placeholder: "סוג תאריך" },
    { name: "forMedicine", placeholder: "לרפואה" },
    { name: "messages", placeholder: "הודעות לציבור " },
    { name: "boardTextColor", placeholder: "צבע טקסט" },
    { name: "boardBackgroundImage", placeholder: "תמונת רקע ללוח" },
    { name: "mapBackgroundImage", placeholder: "תמונת רקע למפה" },
    { name: "timesToShow", placeholder: "זמנים להצגה" },
    { name: "users", placeholder: "משתמשים" },
    { name: "theme", placeholder: "ערכת נושא" },
    { name: "isMinchaSunset", placeholder: "הגדר מנחה לפני שקיעה" },
  ];
  const thems: { name: Theme; title: string }[] = [
    { name: "modern", title: "מודרני" },
    { name: "column", title: "עמודות" },
    // { name: "gold", title: "מהודר" },
  ];
  const boardTextColors: { name: string; title: string }[] = [
    { name: "black", title: "שחור" },
    { name: "auto", title: "אוטומטי" },
  ];

  const handleInputArrayChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number,
    arrayName: "tfilaTimes" | "forUplifting" | "forMedicine" | "messages",
    isBollean?: boolean
  ) => {
    const { name, value } = e.target;
    console.log(
      name,
      ":",
      (e as React.ChangeEvent<HTMLInputElement>).target.checked
    );
    if (dbBoard && Array.isArray(dbBoard[arrayName])) {
      const updatedArray = dbBoard[arrayName]?.map(
        (item: Object, i: number) => {
          if (i === index && typeof item === "object") {
            return {
              ...item,
              [name]: isBollean
                ? (e as React.ChangeEvent<HTMLInputElement>).target.checked
                : value,
            };
          }
          return item;
        }
      );
      setDbBoard({
        ...dbBoard,
        [arrayName]: updatedArray,
      });
      console.log(dbBoard[arrayName]);
    }
  };
  const onDeleteScreen = (screenToDelete: ScreenType) => {
    const filterScreens = dbBoard?.screens.filter(
      (screen) => screen.id !== screenToDelete.id
    );
    if (dbBoard) {
      setDbBoard({
        ...dbBoard,
        screens: [...(filterScreens ?? [])],
      });
    }
  };
  const handleAddScreen = () => {
    setScreenEditorIsOpen(false);
    let newScreen: ScreenType;
    console.log("editingScreen", editingScreen);
    if (editingScreen?.id) {
      handleEditScreen(editingScreen);
      return;
    }
    if (screenTypeEdit === "message") {
      if (editingScreen?.content) {
        newScreen = {
          id: generateRandomId(),
          content: editingScreen.content,
          text: editingScreen.text,
          title: editingScreen.title,
          type: editingScreen.type,
        };
        if (dbBoard) {
          setDbBoard({
            ...dbBoard,
            screens: [...(dbBoard.screens ?? []), newScreen],
          });
        }
        console.log(dbBoard?.screens);
      } else {
      }
    } else if (screenTypeEdit === "image") {
      if (editingScreen?.content) {
        newScreen = {
          id: generateRandomId(),
          content: editingScreen?.content ?? "",
          text: "תמונה",
          title: "",
          type: "image",
        };
        if (dbBoard) {
          setDbBoard({
            ...dbBoard,
            screens: [...(dbBoard.screens ?? []), newScreen],
          });
        }
      }
    }
  };

  const handleOpenModalScreen = (screenType: ScreenTypeTypes) => {
    setScreenTypeEdit(screenType);
    setEditingScreen({
      id: "",
      content: "",
      text: "",
      title: "",
      type: screenType,
    });
    setScreenEditorIsOpen(true);
  };
  const handleEditScreen = (screenToEdit: ScreenType) => {
    console.log("screenToEdit", screenToEdit);
    console.log("dbBoard.screens", dbBoard?.screens);
    const filterScreens = dbBoard?.screens.filter(
      (screen) => screen.id !== screenToEdit.id
    );
    if (dbBoard) {
      setDbBoard({
        ...dbBoard,
        screens: [...(filterScreens ?? []), screenToEdit],
      });
    }
  };
  const addObjectToArray = (
    arrayName: "tfilaTimes" | "forUplifting" | "forMedicine" | "messages",
    dayTfila?: ShabatDayTfila
  ) => {
    if (dbBoard && Array.isArray(dbBoard[arrayName])) {
      if (arrayName !== "tfilaTimes") {
        const addObjectToArray: Message[] = dbBoard[arrayName];
        let newItem: Message = { content: "", date: new Date() };
        addObjectToArray.push(newItem);
        setDbBoard({
          ...dbBoard,
          [arrayName]: addObjectToArray,
        });
      } else if (arrayName === "tfilaTimes" && dayTfila) {
        const addObjectToArray: Tfila[] = dbBoard[arrayName];
        let newItem: Tfila = {
          day: dayTfila,
          name: "",
          time: "",
        };
        addObjectToArray.push(newItem);
        setDbBoard({
          ...dbBoard,
          [arrayName]: addObjectToArray,
        });
      }
    }
  };
  const removeObjectFromArray = (
    arrayName: "tfilaTimes" | "forUplifting" | "forMedicine" | "messages",
    idx: number
  ) => {
    if (dbBoard && Array.isArray(dbBoard[arrayName])) {
      const removeObjectToArray = (
        dbBoard[arrayName] as (Message | Tfila)[]
      ).filter((item: Message | Tfila, index: number) => idx !== index);
      console.log("addObjectToArray", removeObjectToArray);
      setDbBoard({
        ...dbBoard,
        [arrayName]: removeObjectToArray,
      });
    }
  };
  const onDownloadTimesImg = () => {
    if (elementRef.current) {
      console.log("download img");
      toPng(elementRef.current, {
        // cacheBust: false,
        // backgroundColor: "#f2d4b0",
      })
        .then((dataUrl) => {
          const link = document.createElement("a");
          link.download = `${props?.parasha} - ${dbBoard?.boardName}.png`;
          link.href = dataUrl;
          link.click();
        })
        .catch((err) => {
          console.log(err);
        });
    }
    setTimeout(() => setDownloadTimesImgIsOpen(false), 1000);
  };
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    e.preventDefault();
    const { name, value } = e.target;
    console.log(name, ":", value);
    if (dbBoard) {
      setDbBoard({
        ...dbBoard,
        [name]: value,
      });
    }
    console.log(e.target.value);

    // const newBoard={...dbBoard}
    // setDbBoard()
  };
  const updateBoard = async (boardId: string, boardData: any) => {
    if (!boardId) return;
    const boardRef = doc(collection(db, "boards"), boardId); // Get reference to the user document
    try {
      await updateDoc(boardRef, boardData); // Update the user document with new data
      console.log("User updated successfully!");
      setSnackbarIsOpen(true);
      setTimeout(() => setSnackbarIsOpen(false), 2000);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };
  const handleClose = (
    event: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }

    setSnackbarIsOpen(false);
  };
  const showBoard = (id: String) => {
    if (id) {
      navigate(`/board/${id}`);
    }
  };
  const showUsers = (id: String) => {
    if (id) {
      navigate(`/users/${id}`);
    }
  };
  const postCollectionCoustumId = async (
    collectionName: string,
    collectionValues: any,
    idNameCollection: string
  ) => {
    const batch = writeBatch(db);
    const boardRef = doc(collection(db, collectionName), idNameCollection); // Using 'calaniot' as the board ID

    // Set the data for the board document
    batch.set(boardRef, collectionValues);

    // Commit the batch write
    await batch.commit();
  };
  const shabatTimesToEdit: ShabatTimesToEdit[] = [
    { type: "weekday", name: " זמני יום חול" },
    { type: "friday", name: "זמני ערב שבת" },
    { type: "saturday", name: "זמני שבת" },
  ];
  return (
    <div
      style={{
        background: `url(${require("../assets/edit-bg1.png")}) `,
        backgroundSize: "cover !importent",
      }}
      className=" flex flex-col gap-2 sm:justify-center sm:items-center sm:w-full "
    >
      <div className=" sm:grid grid-cols-2 flex flex-col gap-2">
        {dbBoard &&
          inputsBoard.map(({ name, placeholder }) => {
            return (
              <div key={name} className="flex flex-col gap-1 p-2">
                {name !== "users" && name !== "tfilaTimes" && (
                  <span>{placeholder}:</span>
                )}
                {!Array.isArray(dbBoard[name]) &&
                  name !== "boardBackgroundImage" &&
                  name !== "mapBackgroundImage" &&
                  name !== "boardTextColor" &&
                  name !== "dateTypes" &&
                  name !== "screens" &&
                  name !== "isMinchaSunset" &&
                  name !== "theme" && (
                    <TextField
                      dir="rtl"
                      id="filled-basic"
                      label={placeholder}
                      value={dbBoard[name]}
                      name={name}
                      onChange={(e) => handleChange(e)}
                      variant="filled"
                    />
                  )}
                {name === "tfilaTimes" && (
                  <div className="flw flex-col">
                    <div className="flex flex-col gap-2">
                      {shabatTimesToEdit.map((time) => {
                        return (
                          <div className="flex flex-col gap-1">
                            <span>{time.name} :</span>
                            <div className="flex flex-col gap-1">
                              {dbBoard.tfilaTimes.map(
                                (tfila: Tfila, idx: number) => {
                                  return (
                                    time.type === tfila.day && (
                                      <div className="flex  gap-1">
                                        {Object.keys(tfila).map(
                                          (key: string) => {
                                            return (
                                              key !== "day" && (
                                                <div className="flex" key={key}>
                                                  <TextField
                                                    dir="rtl"
                                                    id="filled-basic"
                                                    label={
                                                      dataKeysToHebrewName[key]
                                                    }
                                                    name={key}
                                                    value={
                                                      tfila[key as keyof Tfila]
                                                    }
                                                    onChange={(e) =>
                                                      handleInputArrayChange(
                                                        e,
                                                        idx,
                                                        name
                                                      )
                                                    }
                                                    variant="filled"
                                                  />
                                                </div>
                                              )
                                            );
                                          }
                                        )}
                                        {
                                          <div className="flex">
                                            <Button
                                              onClick={(e) =>
                                                removeObjectFromArray(name, idx)
                                              }
                                              startIcon={<Delete />}
                                            >
                                              הסר
                                            </Button>
                                          </div>
                                        }
                                      </div>
                                    )
                                  );
                                }
                              )}
                            </div>

                            <div>
                              <Button
                                onClick={() =>
                                  addObjectToArray(name, time.type)
                                }
                                variant="contained"
                              >
                                הוסף
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {(name === "messages" ||
                  name === "forMedicine" ||
                  name === "forUplifting") &&
                  dbBoard[name].map((tfila: Message, idx) => (
                    <div key={idx} className="flex w-full  gap-1">
                      {Object.keys(tfila).map((key: string) => {
                        return (
                          key !== "date" && (
                            <div className="flex w-full" key={key}>
                              <TextField
                                dir="rtl"
                                className="w-full"
                                id="filled-basic"
                                label={dataKeysToHebrewName[key]}
                                name={key}
                                value={tfila[key as keyof Message]}
                                onChange={(e) =>
                                  handleInputArrayChange(e, idx, name)
                                }
                                variant="filled"
                              />
                            </div>
                          )
                        );
                      })}
                      <Button
                        onClick={(e) => removeObjectFromArray(name, idx)}
                        startIcon={<Delete />}
                      >
                        הסר
                      </Button>
                    </div>
                  ))}
                {(name === "messages" ||
                  name === "forMedicine" ||
                  name === "forUplifting") && (
                  <div>
                    <Button
                      onClick={() => addObjectToArray(name)}
                      variant="contained"
                    >
                      הוסף
                    </Button>
                  </div>
                )}
                {name === "boardBackgroundImage" && (
                  <div className="flex gap-1 w-full overflow-x-auto">
                    {[
                      "1",
                      "2",
                      "3",
                      "4",
                      "5",
                      "6",
                      "7",
                      "8",
                      "9",
                      "10",
                      "11",
                      "12",
                      "13",
                      "14",
                      "15",
                    ].map((item, index) => (
                      <div
                        onClick={() =>
                          setDbBoard({
                            ...dbBoard,
                            boardBackgroundImage: item,
                          })
                        }
                        key={index}
                        className="min-w-20 min-h-16"
                      >
                        <img
                          src={require("../assets/backgrounds/" +
                            item +
                            ".jpg")}
                          className={`min-w-20 min-h-16 rounded-md ${
                            item === dbBoard.boardBackgroundImage
                              ? "border-2 border-sky-500 border-spacing-1"
                              : ""
                          }`}
                          alt={item}
                        />
                      </div>
                    ))}
                  </div>
                )}
                {/* {name === "mapBackgroundImage" && (
                  <div className="flex gap-1 w-full overflow-x-auto">
                    {beautyColorsHex.map((item: string, index) => (
                      <div
                        onClick={() =>
                          setDbBoard({
                            ...dbBoard,
                            boardBackgroundImage: item,
                          })
                        }
                        style={{ backgroundColor: `${item}` }}
                        key={index}
                        className="min-w-20 min-h-16 rounded-md"
                      ></div>
                    ))}
                  </div>
                )} */}
                {name === "timesToShow" && (
                  <div className="grid grid-cols-2">
                    {Object.keys(translationsZmanimKeys).map((key: string) => {
                      return (
                        <div>
                          {
                            <div>
                              <Checkbox
                                onClick={(e) =>
                                  handleTimesChange(
                                    key as keyof TranslationsZmanimKeys
                                  )
                                }
                                name={"isSaturdayTfila"}
                                checked={dbBoard.timesToShow.includes(
                                  key as keyof TranslationsZmanimKeys
                                )}
                              />
                              {
                                translationsZmanimKeys[
                                  key as keyof TranslationsZmanimKeys
                                ]
                              }{" "}
                            </div>
                          }
                        </div>
                      );
                    })}
                  </div>
                )}
                {name === "dateTypes" && (
                  <div className="flex ">
                    {Object.keys(dateToShow).map((key: string) => {
                      return (
                        <div>
                          {
                            <div>
                              <Checkbox
                                onClick={(e) => {
                                  if (
                                    dbBoard?.dateTypes.includes(
                                      key as keyof DateToShow
                                    )
                                  ) {
                                    let arr = dbBoard?.dateTypes.filter(
                                      (date) => date !== key
                                    );
                                    setDbBoard({
                                      ...dbBoard,
                                      dateTypes: arr,
                                    });
                                  } else {
                                    let arr = [...dbBoard?.dateTypes, key];

                                    setDbBoard({
                                      ...dbBoard,
                                      dateTypes: arr,
                                    });
                                  }
                                }}
                                name={"isSaturdayTfila"}
                                checked={dbBoard.dateTypes.includes(
                                  key as keyof DateToShow
                                )}
                              />
                              {dateToShow[key as keyof DateToShow]}
                            </div>
                          }
                        </div>
                      );
                    })}
                  </div>
                )}
                {name === "isMinchaSunset" && (
                  <div className="flex ">
                    <div className="flex ">
                      <div className="flex flex-col items-center justify-center">
                        <span>הגדר</span>
                        <Checkbox
                          onClick={(e) => {
                            setDbBoard({
                              ...dbBoard,
                              isMinchaSunset: {
                                isActive: !dbBoard.isMinchaSunset.isActive,
                                minBrforeSunSet:
                                  dbBoard.isMinchaSunset.minBrforeSunSet,
                              },
                            });
                          }}
                          name={"isMinchaSunset"}
                          checked={dbBoard.isMinchaSunset.isActive}
                        />
                      </div>

                      <TextField
                        dir="rtl"
                        id="filled-basic"
                        label="דקות לפני שקיעה"
                        name={""}
                        value={dbBoard.isMinchaSunset.minBrforeSunSet}
                        type="number"
                        onChange={(e) =>
                          setDbBoard({
                            ...dbBoard,
                            isMinchaSunset: {
                              isActive: dbBoard.isMinchaSunset.isActive,
                              minBrforeSunSet: Number(e.target.value),
                            },
                          })
                        }
                        variant="filled"
                      />
                    </div>
                  </div>
                )}
                {name === "theme" && (
                  <div className="flex gap-1 flex-1">
                    {thems.map((them: { name: Theme; title: string }) => {
                      return (
                        <div
                          className={`w-20 h-12 cursor-pointer border-2 rounded-md flex items-center justify-center ${
                            dbBoard.theme === them.name
                              ? "bg-sky-400 text-white border-sky-400"
                              : "border-black"
                          }`}
                          onClick={() =>
                            setDbBoard({ ...dbBoard, theme: them.name })
                          }
                        >
                          {them.title}
                        </div>
                      );
                    })}
                  </div>
                )}
                {name === "boardTextColor" && (
                  <div className="flex gap-1 flex-1">
                    {boardTextColors.map(
                      (them: { name: string; title: string }) => {
                        return (
                          <div
                            className={`w-20 h-12 cursor-pointer border-2 rounded-md flex items-center justify-center ${
                              dbBoard.boardTextColor === them.name
                                ? "bg-sky-400 text-white border-sky-400"
                                : "border-black"
                            }`}
                            onClick={() =>
                              setDbBoard({
                                ...dbBoard,
                                boardTextColor: them.name,
                              })
                            }
                          >
                            {them.title}
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
                {name === "screens" && (
                  <div className="flex flex-col">
                    <div className="flex gap-2">
                      {screenTypes.map((screen: ScreenType, index) => {
                        return (
                          <div
                            className="shadow-lg text-center cursor-pointer bg-white rounded-lg flex items-center justify-center  w-20 h-16 "
                            key={index}
                            onClick={() => handleOpenModalScreen(screen.type)}
                          >
                            {screen.text}
                          </div>
                        );
                      })}
                    </div>
                    <Modal
                      open={screenEditorIsOpen}
                      onClose={() => setScreenEditorIsOpen(false)}
                      aria-labelledby="modal-modal-title"
                      aria-describedby="modal-modal-description"
                    >
                      <Box sx={style}>
                        <div className="w-full min-h-[320px]  flex flex-col gap-3">
                          <span className="text-center"> כך זה יראה</span>
                          <div
                            style={{
                              background: `url(${require("../assets/backgrounds/" +
                                dbBoard.boardBackgroundImage +
                                ".jpg")}) no-repeat`,
                              backgroundSize: "cover !importent",
                            }}
                            className="w-full h-full !bg-cover flex justify-center items-center p-3  "
                          >
                            {screenTypeEdit === "image" &&
                              editingScreen?.content && (
                                <div
                                  dir="rtl"
                                  className="flex flex-col w-full items-center justify-center text-center text-2xl font-['David']"
                                >
                                  <span>{editingScreen?.title}</span>
                                  <img
                                    className="w-full h-3/4"
                                    alt=""
                                    src={editingScreen?.content}
                                  />
                                </div>
                              )}
                            {screenTypeEdit === "message" &&
                              editingScreen?.content && (
                                <div
                                  dir="rtl"
                                  className="flex w-full items-center justify-center text-center text-2xl font-['David']"
                                >
                                  {editingScreen?.content}
                                </div>
                              )}
                          </div>
                          {screenTypeEdit === "image" && editingScreen && (
                            <div className="w-full">
                              <input
                                dir="rtl"
                                className="border border-black w-full h-8 px-3 mb-3 rounded-sm"
                                placeholder="הוסף כותרת"
                                type="text"
                                value={editingScreen?.title}
                                onChange={(e) =>
                                  setEditingScreen({
                                    id: editingScreen?.id,
                                    text: editingScreen?.text,
                                    title: e.target.value,
                                    type: editingScreen?.type,
                                    content: editingScreen.content,
                                  })
                                }
                              />
                              <UploadWidget
                                text={"הוסף תמונה"}
                                onSetImageUrl={(e: string) =>
                                  setEditingScreen({
                                    id: editingScreen?.id,
                                    text: editingScreen?.text,
                                    title: editingScreen?.title,
                                    type: editingScreen?.type,
                                    content: e,
                                  })
                                }
                              />
                            </div>
                          )}
                          {screenTypeEdit === "message" && editingScreen && (
                            <div className="w-full">
                              <input
                                dir="rtl"
                                className="border border-black w-full h-8 px-3 rounded-sm"
                                placeholder="הקלד הודעה"
                                type="text"
                                value={editingScreen?.content}
                                onChange={(e) =>
                                  setEditingScreen({
                                    id: editingScreen?.id,
                                    text: editingScreen?.text,
                                    title: editingScreen?.title,
                                    type: editingScreen?.type,
                                    content: e.target?.value,
                                  })
                                }
                              />
                            </div>
                          )}
                          <Button
                            onClick={() => handleAddScreen()}
                            variant="contained"
                          >
                            אישור
                          </Button>
                        </div>
                      </Box>
                    </Modal>
                    <div>
                      {dbBoard.screens && (
                        <div>
                          <div> המסכים שלך :</div>
                          <div className="flex gap-2">
                            {dbBoard.screens.map(
                              (screen: ScreenType, index) => {
                                return (
                                  <div
                                    className="flex flex-col gap-2"
                                    key={index}
                                  >
                                    <div
                                      style={{
                                        background: `url(${require("../assets/backgrounds/" +
                                          dbBoard.boardBackgroundImage +
                                          ".jpg")}) no-repeat`,
                                        backgroundSize: "cover !importent",
                                      }}
                                      className="w-20 h-16 !bg-cover flex justify-center items-center p-3  "
                                    >
                                      {screen.type === "image" &&
                                        screen?.content && (
                                          <div
                                            dir="rtl"
                                            className="flex flex-col max-h-full w-full items-center justify-center text-center text-[10px] font-['David']"
                                          >
                                            <div>
                                              {screen.title && (
                                                <span className="">
                                                  {screen.title}
                                                </span>
                                              )}
                                              <img
                                                className="w-full h-full"
                                                src={screen?.content}
                                                alt=""
                                              />
                                            </div>
                                          </div>
                                        )}
                                      {screen.type === "message" &&
                                        screen?.content && (
                                          <div
                                            dir="rtl"
                                            className="flex w-full items-center justify-center text-center text-[10px] font-['David']"
                                          >
                                            {screen?.content}
                                          </div>
                                        )}
                                    </div>
                                    <Button
                                      onClick={() => {
                                        setEditingScreen(screen);
                                        setScreenEditorIsOpen(true);
                                        setScreenTypeEdit(screen.type);
                                      }}
                                      variant="contained"
                                    >
                                      ערוך
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        onDeleteScreen(screen);
                                      }}
                                      variant="contained"
                                    >
                                      הסר
                                    </Button>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
      <div className="w-full flex flex-col justify-center gap-2 items-center my-3">
        <Button
          className="mobile-only:w-3/4 w-36"
          variant="contained"
          onClick={() => updateBoard(id ?? "", dbBoard)}
        >
          עדכן לוח
        </Button>
        <Button
          className="mobile-only:w-3/4 w-36"
          variant="contained"
          onClick={() => showBoard(id ?? "")}
        >
          להצגת הלוח
        </Button>
        {/* <Button
          className="mobile-only:w-3/4 w-36"
          variant="contained"
          onClick={() => showUsers(id ?? "")}
        >
          מתפללים
        </Button> */}
        <Button
          className="mobile-only:w-3/4 w-36"
          variant="contained"
          onClick={() => setDownloadTimesImgIsOpen(true)}
        >
          יצא תמונה
        </Button>
      </div>
      {/* <div className="w-full h-56">
        <Kboard board={dbBoard} zmanim={props.zmanim} parasha={props.parasha} />
      </div> */}
      <div className="">
        <Modal
          open={downloadTimesImgIsOpen}
          onClose={() => setDownloadTimesImgIsOpen(false)}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={styleDownloadImgBox}>
            {dbBoard && (
              <div ref={elementRef}>
                <Card
                  className="!bg-cover bg-repeat-round py-4"
                  sx={{
                    width: 345,

                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `url(${require("../assets/background-times.webp")}) no-repeat`,
                    backgroundSize: "cover !importent",
                  }}
                >
                  <CardContent>
                    <div className="w-full font-['Comix'] flex flex-col items-center weekly-times ">
                      <div className="w-full font-['Comix'] flex justify-center text-xl font-bold">
                        {dbBoard.boardName}
                      </div>
                      <div className="flex flex-col items-center justify-center px-2 w-[85%]">
                        <table dir="rtl" className="">
                          <tr>
                            <th>{props.parasha}</th>
                            <th>ימי חול</th>
                          </tr>
                          <tr>
                            <td className="w-1/2 px-1">
                              {shabatTimesToEdit.map((time) => {
                                return (
                                  <div className="flex flex-col gap-1 w-full text-base   ">
                                    {/* <div className="underline w-full font-bold">{time.name}</div> */}
                                    {dbBoard.tfilaTimes.map((tfila: Tfila) => {
                                      return (
                                        tfila.day !== "weekday" &&
                                        time.type === tfila.day && (
                                          <div className="flex  w-full flex-col  ">
                                            <div className="flex w-full items-center justify-between gap-1">
                                              <span className="leading-4">
                                                {tfila.name}:
                                              </span>
                                              <span>{tfila.time} </span>
                                            </div>
                                          </div>
                                        )
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </td>
                            <td className="w-1/2 p-2  ">
                              {shabatTimesToEdit.map((time) => {
                                return (
                                  <div className="flex flex-col gap-1 w-full text-base items-center justify-center border-black  ">
                                    {/* <div className="underline w-full font-bold">{time.name}</div> */}
                                    {dbBoard.tfilaTimes.map((tfila: Tfila) => {
                                      return (
                                        tfila.day === "weekday" &&
                                        time.type === tfila.day && (
                                          <div className="flex w-full flex-col  ">
                                            <div className="flex w-full items-center justify-center gap-2">
                                              <span>{tfila.name}:</span>
                                              <span>{tfila.time} </span>
                                            </div>
                                          </div>
                                        )
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </td>
                          </tr>
                        </table>
                        <div className="relative">
                          {dbBoard.messages && dbBoard.messages.length > 0 && (
                            <div className="w-full flex flex-col items-center justify-center text-center">
                              <div className="font-bold">הודעות</div>
                              {dbBoard.messages.map((message) => {
                                return (
                                  <div dir="rtl" className="font-sm flex">
                                    <span>-</span>
                                    {` ${message.content} `}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {/* <div className="relative">
                    <Decorative1 className="absolute top-[-58px" />
                  </div> */}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            <Button onClick={onDownloadTimesImg} variant="contained">
              הורד
            </Button>
          </Box>
        </Modal>
      </div>

      <Snackbar
        className="flex flex-row-reverse"
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        open={snackbarIsOpen}
        dir="rtl"
        key={"bottom" + "center"}
      >
        <Alert
          onClose={handleClose}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          הלוח עודכן בהצלחה!
        </Alert>
      </Snackbar>
    </div>
  );
}
export default EditBoard;

EditBoard.defaultProps = {
  parasha: "",
  zmanim: undefined,
};

interface Props {
  parasha: string;
  zmanim: Zman[] | undefined;
}
const style = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 350,
  bgcolor: "background.paper",
  border: "",
  boxShadow: 24,
  p: 6,
};
const styleDownloadImgBox = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 2,
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 450,
  bgcolor: "background.paper",
  border: "",
  boxShadow: 24,

  p: 6,
};
