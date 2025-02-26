import { useEffect, useState } from "react";
import instance from "../../../API/instance";
import ReactDOMServer from "react-dom/server"; // For rendering the component to a string
import InvoiceContent from "../InvoiceContent";

const InvoicePreview = ({ booking }) => {
  const [client, setClient] = useState(null);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const response = await instance.get(
          `/trips/trip/${booking.trip}/client/${booking.client}/`
        );
        setClient(response.data);
      } catch (error) {
        console.error("Error fetching client details:", error);
      }
    };
    fetchClient();
  }, [booking]); // Depend on booking to avoid unnecessary re-fetches

  const handlePrint = () => {
    if (!client) {
      alert("لم يتم تحميل بيانات العميل بعد!"); // Alert if client data isn't available yet
      return;
    }

    const printWindow = window.open("", "_blank");
    printWindow.document.write(
      `<html><head><title>تذكرة الرحلة</title></head><body>`
    );
    printWindow.document.write(
      `<div id="invoice-content"></div></body></html>`
    );
    printWindow.document.close();

    // Render the InvoiceContent component in the new window
    printWindow.document.getElementById("invoice-content").innerHTML =
      ReactDOMServer.renderToString(
        <InvoiceContent client={client} booking={booking} />
      );

    // Trigger print
    printWindow.print();
  };

  return (
    <div className="p-6 bg-gray-100 rounded-lg mt-4">
      <h3 className="text-lg font-bold mb-4">تذكرة الرحلة</h3>
      <div className="space-y-2">
        <p>
          <strong>رقم الرحلة:</strong> {client?.tripNumber || "جارِ التحميل..."}
        </p>
        <p>
          <strong>التاريخ:</strong>{" "}
          {client?.date
            ? `${new Date(client.date)
                .getDate()
                .toString()
                .padStart(2, "0")}-${(new Date(client.date).getMonth() + 1)
                .toString()
                .padStart(2, "0")}-${new Date(
                client.date
              ).getFullYear()}   |   ${new Date(client.date).toLocaleDateString(
                "ar-SA",
                {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }
              )}`
            : "جارِ التحميل..."}
        </p>

        <p>
          <strong>شركة التأجير:</strong>{" "}
          {client?.leasingCompany || "جارِ التحميل..."}
        </p>
        <p>
          <strong>تكلفة الرحلة:</strong> {booking.totalAmount} ريال
        </p>
        <p>
          <strong>المبلغ المدفوع:</strong> {booking.paidAmount} ريال
        </p>
        <p>
          <strong>الباقي:</strong> {booking.remainingAmount} ريال
        </p>
      </div>
      <button
        onClick={handlePrint}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
      >
        طباعة الفاتورة
      </button>
    </div>
  );
};

export default InvoicePreview;
