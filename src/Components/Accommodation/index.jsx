import React, { useState } from "react";

const Accommodation = () => {
  const [tripDates, setTripDates] = useState(["2025-02-25", "2025-03-01"]);
  const [selectedDate, setSelectedDate] = useState("");
  const [groups, setGroups] = useState([]);
  const [supervisorName, setSupervisorName] = useState("");
  const [supervisorPhone, setSupervisorPhone] = useState("");
  const [roomCounts, setRoomCounts] = useState({
    totalRooms: 0,
    six: 0,
    five: 0,
    four: 0,
    three: 0,
    two: 0,
  });

  // إنشاء مجموعات جديدة
  const initializeGroups = () => {
    const initialGroups = Array.from({ length: 16 }, (_, i) => ({
      id: i + 1,
      name: `مجموعة ${i + 1}`,
      rooms: Array.from({ length: 6 }, () => ({
        roomNumber: "",
        clientName: "",
        checkoutDate: "",
      })),
    }));
    setGroups(initialGroups);
  };

  // إضافة مجموعة جديدة
  const addGroup = () => {
    const newGroup = {
      id: groups.length + 1,
      name: `مجموعة ${groups.length + 1}`,
      rooms: Array.from({ length: 6 }, () => ({
        roomNumber: "",
        clientName: "",
        checkoutDate: "",
      })),
    };
    setGroups([...groups, newGroup]);
  };

  // تغيير بيانات الغرفة
  const updateRoom = (groupId, roomIndex, field, value) => {
    const updatedGroups = groups.map((group) =>
      group.id === groupId
        ? {
            ...group,
            rooms: group.rooms.map((room, index) =>
              index === roomIndex ? { ...room, [field]: value } : room
            ),
          }
        : group
    );
    setGroups(updatedGroups);
  };

  // تغيير اسم المجموعة
  const updateGroupName = (groupId, newName) => {
    const updatedGroups = groups.map((group) =>
      group.id === groupId ? { ...group, name: newName } : group
    );
    setGroups(updatedGroups);
  };

  // اختيار تاريخ الرحلة
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    initializeGroups();
  };

  // تحديث إحصائيات الغرف
  const updateRoomCount = (type, value) => {
    setRoomCounts((prev) => ({ ...prev, [type]: Number(value) }));
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">تسكين الرحلات</h1>

      {/* اختيار تاريخ الرحلة */}
      <div className="mb-4">
        <label className="block mb-2">تاريخ الرحلة:</label>
        <div className="flex gap-2">
          {tripDates.map((date) => (
            <button
              key={date}
              onClick={() => handleDateSelect(date)}
              className={`px-4 py-2 rounded ${
                selectedDate === date ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {date}
            </button>
          ))}
        </div>
      </div>

      {/* إدخال اسم المشرف ورقم جواله */}
      <div className="mb-4">
        <label className="block">اسم المشرف:</label>
        <input
          type="text"
          value={supervisorName}
          onChange={(e) => setSupervisorName(e.target.value)}
          className="border p-2 w-full mb-2"
        />
        <label className="block">رقم جوال المشرف:</label>
        <input
          type="text"
          value={supervisorPhone}
          onChange={(e) => setSupervisorPhone(e.target.value)}
          className="border p-2 w-full"
        />
      </div>

      {/* عرض المجموعات */}
      {selectedDate && (
        <div>
          <h2 className="text-xl font-bold mb-2">المجموعات</h2>
          {groups.map((group) => (
            <div key={group.id} className="border p-4 mb-4 rounded bg-gray-100">
              <div className="flex justify-between items-center mb-2">
                <input
                  type="text"
                  value={group.name}
                  onChange={(e) => updateGroupName(group.id, e.target.value)}
                  className="border p-2 w-1/2"
                />
                <button
                  onClick={() => addGroup()}
                  className="bg-green-500 text-white px-4 py-2 rounded"
                >
                  + إضافة مجموعة
                </button>
              </div>

              <table className="w-full border-collapse border">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2">رقم الغرفة</th>
                    <th className="border p-2">اسم العميل</th>
                    <th className="border p-2">تاريخ الخروج</th>
                  </tr>
                </thead>
                <tbody>
                  {group.rooms.map((room, index) => (
                    <tr key={index}>
                      <td className="border p-2">
                        <input
                          type="text"
                          value={room.roomNumber}
                          onChange={(e) =>
                            updateRoom(
                              group.id,
                              index,
                              "roomNumber",
                              e.target.value
                            )
                          }
                          className="border p-1 w-full"
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="text"
                          value={room.clientName}
                          onChange={(e) =>
                            updateRoom(
                              group.id,
                              index,
                              "clientName",
                              e.target.value
                            )
                          }
                          className="border p-1 w-full"
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="date"
                          value={room.checkoutDate}
                          onChange={(e) =>
                            updateRoom(
                              group.id,
                              index,
                              "checkoutDate",
                              e.target.value
                            )
                          }
                          className="border p-1 w-full"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* إحصائيات الغرف */}
      {selectedDate && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2">إحصائيات الغرف</h2>
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">إجمالي عدد الغرف</th>
                <th className="border p-2">الغرف السداسية</th>
                <th className="border p-2">الخماسية</th>
                <th className="border p-2">الرباعية</th>
                <th className="border p-2">الثلاثية</th>
                <th className="border p-2">الثنائية</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {Object.keys(roomCounts).map((key) => (
                  <td key={key} className="border p-2">
                    <input
                      type="number"
                      value={roomCounts[key]}
                      onChange={(e) => updateRoomCount(key, e.target.value)}
                      className="border p-1 w-full"
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Accommodation;
