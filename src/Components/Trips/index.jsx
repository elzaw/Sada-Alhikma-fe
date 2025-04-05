import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import instance from "../../API/instance"; // Your API instance
// import CreateTripForm from "./CreateTripForm";
import toast from "react-hot-toast";
import CreateTripForm from "./CreateTripForm";

const Trips = () => {
  const [trips, setTrips] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [filterTripNumber, setFilterTripNumber] = useState("");
  const navigate = useNavigate();

  // Fetch trips from API
  const fetchTrips = async () => {
    try {
      const response = await instance.get("/trips");
      setTrips(response.data);
    } catch (error) {
      console.error("Error fetching trips:", error);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  // Navigate to trip page
  const handleTripClick = (tripId) => {
    navigate(`/trip/${tripId}`);
  };

  // Filter trips based on date and trip number
  const filteredTrips = trips.filter((trip) => {
    const matchesDate = filterDate
      ? new Date(trip.date).toISOString().split("T")[0] === filterDate
      : true;
    const matchesTripNumber = filterTripNumber
      ? trip.tripNumber.includes(filterTripNumber)
      : true;
    return matchesDate && matchesTripNumber;
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">إدارة الرحلات</h1>

      {/* Filters and Create Trip Button */}
      <div className="mb-4 flex flex-col lg:flex-row gap-4">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        />
        <input
          type="text"
          placeholder="ابحث برقم الرحلة"
          value={filterTripNumber}
          onChange={(e) => setFilterTripNumber(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        />
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          إنشاء رحلة جديدة
        </button>
      </div>

      {/* Trips List */}
      <div className="space-y-4">
        {filteredTrips.map((trip) => (
          <div
            key={trip._id}
            onClick={() => handleTripClick(trip._id)}
            className="p-4 border rounded-lg shadow-sm bg-white cursor-pointer hover:bg-gray-50"
          >
            <h2 className="text-xl font-semibold">
              الرحلة: {trip.tripNumber} -{" "}
              {new Date(trip.date).toLocaleDateString()} -{" "}
              {new Date(trip.date).toLocaleDateString("ar-SA", {
                weekday: "long", // يوم الأسبوع (مثل "السبت")
                year: "numeric", // السنة (مثل "2023")
                month: "long", // الشهر (مثل "أكتوبر")
                day: "numeric", // اليوم (مثل "15")
              })}
            </h2>
          </div>
        ))}
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="max-h-[80vh] overflow-y-auto p-6">
                <CreateTripForm
                  setShowCreateForm={setShowCreateForm}
                  onTripCreated={fetchTrips} // Pass fetchTrips as a prop
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trips;
