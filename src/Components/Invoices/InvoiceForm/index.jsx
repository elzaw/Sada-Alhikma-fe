import React, { useEffect, useState } from "react";
// import { toast } from "react-toastify";
// import instance from "../api/instance";
import toast from "react-hot-toast";
import instance from "../../../API/instance";

const Accommodation = () => {
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [clients, setClients] = useState([]);
  const [groups, setGroups] = useState([]);

  // جلب الرحلات عند تحميل الصفحة
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await instance.get("/trips");
        const formattedTrips = response.data.map((trip) => ({
          value: trip._id,
          label: `${trip.tripNumber} - ${new Date(
            trip.date
          ).toLocaleDateString()}`,
        }));
        setTrips(formattedTrips);
      } catch (error) {
        console.error("Error fetching trips:", error);
        toast.error("فشل في تحميل الرحلات.");
      }
    };

    fetchTrips();
  }, []);

  // جلب العملاء عند اختيار الرحلة
  const fetchClients = async (tripId) => {
    try {
      const response = await instance.get(`/trips/${tripId}/clients`);
      setClients(response.data);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("فشل في تحميل العملاء.");
    }
  };

  // عند اختيار رحلة
  const handleTripSelect = (e) => {
    const tripId = e.target.value;
    setSelectedTrip(tripId);
    fetchClients(tripId);
    initializeGroups(); // إنشاء مجموعات جديدة عند اختيار الرحلة
  };

  // إنشاء المجموعات
  const initializeGroups = () => {
    const initialGroups = Array.from({ length: 16 }, (_, i) => ({
      id: i + 1,
      name: `مجموعة ${i + 1}`,
      rooms: Array.from({ length: 6 }, () => ({ clientName: "" })),
    }));
    setGroups(initialGroups);
  };

  // التعامل مع السحب
  const handleDragStart = (e, clientName) => {
    e.dataTransfer.setData("clientName", clientName);
  };

  // التعامل مع الإفلات
  const handleDrop = (e, groupId, roomIndex) => {
    const clientName = e.dataTransfer.getData("clientName");
    const updatedGroups = groups.map((group) =>
      group.id === groupId
        ? {
            ...group,
            rooms: group.rooms.map((room, index) =>
              index === roomIndex ? { ...room, clientName } : room
            ),
          }
        : group
    );
    setGroups(updatedGroups);
    setClients(clients.filter((client) => client.name !== clientName));
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">تسكين الرحلات</h1>

      {/* اختيار الرحلة */}
      <div className="mb-4">
        <label className="block mb-2">اختر الرحلة:</label>
        <select onChange={handleTripSelect} className="border p-2 w-full">
          <option value="">-- اختر رحلة --</option>
          {trips.map((trip) => (
            <option key={trip.value} value={trip.value}>
              {trip.label}
            </option>
          ))}
        </select>
      </div>

      {/* قائمة العملاء */}
      {clients.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">العملاء</h2>
          <div className="flex gap-2 flex-wrap">
            {clients.map((client) => (
              <div
                key={client.id}
                draggable
                onDragStart={(e) => handleDragStart(e, client.name)}
                className="px-4 py-2 bg-blue-100 rounded cursor-pointer"
              >
                {client.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* عرض المجموعات */}
      {groups.map((group) => (
        <div key={group.id} className="border p-4 mb-4 rounded bg-gray-100">
          <h3 className="font-bold mb-2">{group.name}</h3>
          <div className="grid grid-cols-3 gap-2">
            {group.rooms.map((room, index) => (
              <div
                key={index}
                onDrop={(e) => handleDrop(e, group.id, index)}
                onDragOver={(e) => e.preventDefault()}
                className="border p-2 min-h-[40px] bg-white"
              >
                {room.clientName || "اسحب العميل هنا"}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Accommodation;
