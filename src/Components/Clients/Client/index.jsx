import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import instance from "../../../API/instance";
import InvoicePreview from "../../Invoices/InvoicePreview";
import {
  FaUser,
  FaPhone,
  FaIdCard,
  FaMapMarkerAlt,
  FaGlobe,
  FaHistory,
} from "react-icons/fa";

const Client = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [invoices, setInvoices] = useState({});
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const response = await instance.get(`/clients/${id}`);
        setClient(response.data);
      } catch (error) {
        console.error("Error fetching client details:", error);
      }
    };

    fetchClient();
  }, [id]);

  useEffect(() => {
    if (!client?.bookings?.length) return;

    const fetchInvoices = async () => {
      setLoadingInvoices(true);

      const invoicesData = {};
      const fetchPromises = client.bookings.map(async (booking) => {
        const tripId = booking._id;

        if (!tripId) return;

        try {
          const response = await instance.get(
            `/invoices/client/${id}/trip/${tripId}`
          );
          invoicesData[tripId] = response.data;
        } catch (error) {
          // Silently handle 404 errors as not all trips have invoices
          if (error.response?.status !== 404) {
            console.error(`Error fetching invoice for trip ${tripId}:`, error);
          }
          invoicesData[tripId] = null;
        }
      });

      await Promise.all(fetchPromises);
      setInvoices((prev) => ({ ...prev, ...invoicesData }));
      setLoadingInvoices(false);
    };

    fetchInvoices();
  }, [client, id]);

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl font-bold text-gray-800">تفاصيل العميل</h1>
          <button
            onClick={() => navigate("/clients")}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition-colors duration-200"
          >
            العودة للقائمة
          </button>
        </div>

        {/* Client Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <FaUser className="text-blue-500 text-xl" />
              <h3 className="text-lg font-semibold text-gray-700">الاسم</h3>
            </div>
            <p className="text-gray-600">{client.name}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <FaPhone className="text-green-500 text-xl" />
              <h3 className="text-lg font-semibold text-gray-700">
                رقم الجوال
              </h3>
            </div>
            <p className="text-gray-600">{client.phone}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <FaGlobe className="text-purple-500 text-xl" />
              <h3 className="text-lg font-semibold text-gray-700">الجنسية</h3>
            </div>
            <p className="text-gray-600">{client.nationality}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <FaIdCard className="text-orange-500 text-xl" />
              <h3 className="text-lg font-semibold text-gray-700">
                رقم الهوية
              </h3>
            </div>
            <p className="text-gray-600">{client.identityNumber}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <FaMapMarkerAlt className="text-red-500 text-xl" />
              <h3 className="text-lg font-semibold text-gray-700">
                مكان الركوب
              </h3>
            </div>
            <p className="text-gray-600">{client.boardingLocation}</p>
          </div>
        </div>
      </div>

      {/* Trips Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <FaHistory className="text-blue-500 text-2xl" />
          <h2 className="text-2xl font-bold text-gray-800">الرحلات</h2>
        </div>

        {loadingInvoices ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : client.bookings.length > 0 ? (
          <div className="space-y-6">
            {client.bookings.map((booking) => {
              const tripId = booking?._id;
              return (
                <div
                  key={tripId}
                  className="border rounded-lg p-6 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 mb-1">
                        رقم الرحلة
                      </h4>
                      <p className="text-gray-800">{booking.tripNumber}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 mb-1">
                        التاريخ
                      </h4>
                      <p className="text-gray-800">
                        {new Date(booking.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 mb-1">
                        شركة التأجير
                      </h4>
                      <p className="text-gray-800">{booking.leasingCompany}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 mb-1">
                        تكلفة الرحلة
                      </h4>
                      <p className="text-gray-800">{booking.totalTripCost}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 mb-1">
                        المبلغ المدفوع
                      </h4>
                      <p className="text-gray-800">{booking.totalTripPaid}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 mb-1">
                        صافي المبلغ
                      </h4>
                      <p className="text-gray-800">
                        {booking.totalTripNetAmount}
                      </p>
                    </div>
                  </div>

                  {/* Invoice Preview */}
                  <div className="mt-4 pt-4 border-t">
                    {invoices[tripId] ? (
                      <InvoicePreview booking={invoices[tripId]} />
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-red-500">
                          لا يوجد فاتورة لهذه الرحلة
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">لا توجد حجوزات لهذا العميل</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Client;
