import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import instance from "../../../API/instance";
import InvoicePreview from "../../Invoices/InvoicePreview";

const Client = () => {
  const { id } = useParams();
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

        if (!tripId) {
          console.warn("tripId is undefined for booking:", booking);
          return;
        }

        try {
          const response = await instance.get(
            `/invoices/client/${id}/trip/${tripId}`
          );
          invoicesData[tripId] = response.data;
        } catch (error) {
          console.error(`Error fetching invoice for trip ${tripId}:`, error);
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
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4">تفاصيل العميل</h1>

      <div className="space-y-4">
        <p>
          <strong>الاسم:</strong> {client.name}
        </p>
        <p>
          <strong>رقم الجوال:</strong> {client.phone}
        </p>
        <p>
          <strong>الجنسية:</strong> {client.nationality}
        </p>
        <p>
          <strong>رقم الهوية:</strong> {client.identityNumber}
        </p>
        <p>
          <strong>مكان الركوب:</strong> {client.boardingLocation}
        </p>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4 text-center">الرحلات</h2>
        {loadingInvoices ? (
          <p>جاري تحميل الفواتير...</p>
        ) : client.bookings.length > 0 ? (
          <ul className="space-y-4">
            {client.bookings.map((booking) => {
              const tripId = booking?._id;
              return (
                <li key={tripId} className="p-4 border rounded-lg">
                  <p>
                    <strong>رقم الرحلة:</strong> {booking.tripNumber}
                  </p>
                  <p>
                    <strong>التاريخ:</strong>{" "}
                    {new Date(booking.date).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>شركة التأجير:</strong> {booking.leasingCompany}
                  </p>
                  <p>
                    <strong>تكلفة الرحلة:</strong> {booking.totalTripCost}
                  </p>
                  <p>
                    <strong>المبلغ المدفوع:</strong> {booking.totalTripPaid}
                  </p>
                  <p>
                    <strong>صافي المبلغ:</strong> {booking.totalTripNetAmount}
                  </p>

                  {/* عرض الفاتورة أو رسالة "لا يوجد" */}
                  {invoices[tripId] ? (
                    <InvoicePreview booking={invoices[tripId]} />
                  ) : (
                    <p className="text-red-500">لا يوجد فاتورة لهذه الرحلة.</p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p>لا توجد حجوزات لهذا العميل.</p>
        )}
      </div>
    </div>
  );
};

export default Client;
