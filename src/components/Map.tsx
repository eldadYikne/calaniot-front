import React, { useEffect, useState } from "react";
import axios from "axios";
import User from "../types/user";
import chair from "../assets/chair.svg";
import man from "../assets/man.svg";
import { collection, getDocs } from "firebase/firestore";
import { db } from "..";

function Map() {
  const seat = [8, 18];
  const allSeats: any = [];
  const [seats, setseats] = useState<any>();
  const [users, setUsers] = useState<any>();
  useEffect(() => {
    async function fetchData() {
      await getUsers();
      setTimeout(async () => {
        // await getSeats();
      }, 100);
    }
    fetchData();
  }, []);

  const getUsers = async () => {
    await getDocs(collection(db, "users"))
      .then((shot) => {
        const news = shot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
        setUsers(news);
        console.log("news", news);
      })
      .catch((error) => console.log(error));
  };

  const getSeats = async () => {
    try {
      for (var i = 0; i < seat[0]; i++) {
        allSeats[i] = [];
        for (var j = 0; j < seat[1]; j++) {
          if (j > 6 && j < 11 && i > 2) {
            allSeats[i][j] = "";
          } else {
            let currentSeat = `${i}${j}`;
            const currentUserSeat = users?.find((user: User) =>
              user.seats?.includes(currentSeat) ? user.name : false
            );
            allSeats[i][j] = currentUserSeat ?? currentSeat;
          }
        }
      }
      setseats(allSeats);
      console.table(allSeats);
      console.log(allSeats);
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <div
      dir="ltr"
      className="bg-amber-700  flex flex-col items-center  justify-center text-white"
    >
      <button onClick={getSeats}>הצג מפה</button>

      <table>
        <tbody>
          {seats?.length > 1 &&
            users?.length > 1 &&
            seats?.map((row: any, rowIndex: number) => (
              <tr className="py-2 flex" key={rowIndex}>
                {row.map((seatData: any, columnIndex: number) => {
                  return seatData.name ? (
                    <td
                      className="px-2 w-14 h-14 flex flex-col items-center justify-center relative"
                      key={columnIndex}
                    >
                      <img
                        src={chair}
                        className="w-12 h-12 shadow-xl"
                        alt="logo"
                      />
                      {typeof seatData === "object" && seatData.present && (
                        <img
                          src={man}
                          className="w-4 h-4 absolute bottom-[30px]"
                          alt="man"
                        />
                      )}
                      <span className="text-sm">
                        {typeof seatData === "object"
                          ? seatData.name
                          : seatData}
                      </span>
                    </td>
                  ) : (
                    <td
                      className="px-2 w-14 h-14 flex flex-col items-center justify-center relative"
                      key={columnIndex}
                    ></td>
                  );
                })}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

export default Map;
