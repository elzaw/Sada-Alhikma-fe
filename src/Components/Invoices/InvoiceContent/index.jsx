// InvoiceContent.js
import React from "react";

const InvoiceContent = ({ client, booking }) => {
  return (
    <html>
      <head>
        <title>تذكرة الرحلة</title>
        {/* Include Tailwind CSS CDN */}
        {/* <script src="https://cdn.tailwindcss.com"></script> */}
      </head>
      <body dir="rtl" className="bg-gray-100 p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">تذكرة الرحلة</h2>
            <p className="text-sm text-gray-600 mt-2">
              تاريخ الفاتورة:{" "}
              {new Date().toLocaleDateString("ar-SA", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <p className="text-gray-700">
              <strong>رقم الرحلة:</strong> {client.tripNumber || "غير متوفر"}
            </p>
            <p className="text-gray-700">
              <strong>التاريخ:</strong>{" "}
              {client.date
                ? new Date(client.date).toLocaleDateString()
                : "غير متوفر"}
            </p>
            <p className="text-gray-700">
              <strong>شركة التأجير:</strong>{" "}
              {client.leasingCompany || "غير متوفر"}
            </p>
            <p className="text-gray-700">
              <strong>تكلفة الرحلة:</strong> {booking.totalAmount} ريال
            </p>
            <p className="text-gray-700">
              <strong>المبلغ المدفوع:</strong> {booking.paidAmount} ريال
            </p>
            <p className="text-gray-700">
              <strong>الباقي:</strong> {booking.remainingAmount} ريال
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              <strong>
                صـدى الحكمة للعمـــــــــــــرة والزيــــــــــــارة
              </strong>
            </p>
            <p className="text-sm text-gray-600">
              هاتف: 0530368559 - 0507005838 - 0555435531
            </p>
            <p className="text-sm text-gray-600">
              البريد الإلكتروني: info@company.com
            </p>
          </div>
        </div>

        {/* Print Script */}
        <script>
          {`
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          `}
        </script>
      </body>
    </html>
  );
};

export default InvoiceContent;
