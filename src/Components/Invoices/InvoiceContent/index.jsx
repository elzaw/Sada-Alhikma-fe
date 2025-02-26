// InvoiceContent.js
import React from "react";

const InvoiceContent = ({ client, booking }) => {
  return (
    <html>
      <head>
        <title>تذكرة الرحلة</title>
        {/* Include Tailwind CSS CDN */}
        {/* <script src="https://cdn.tailwindcss.com"></script> */}
        <style>
          {`
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .print-hidden {
                display: none;
              }
            }
          `}
        </style>
      </head>
      <body className="bg-gray-100 p-6">
        <div
          dir="rtl"
          className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8"
        >
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

          {/* Client Details */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              معلومات العميل
            </h3>
            <div className="space-y-2">
              <p className="text-gray-700">
                <strong>الاسم:</strong> {client.name || "غير متوفر"}
              </p>
              <p className="text-gray-700">
                <strong>الهاتف:</strong> {client.phone || "غير متوفر"}
              </p>
              <p className="text-gray-700">
                <strong>البريد الإلكتروني:</strong>{" "}
                {client.email || "غير متوفر"}
              </p>
            </div>
          </div>

          {/* Booking Details */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              تفاصيل الحجز
            </h3>
            <div className="space-y-2">
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
            </div>
          </div>

          {/* Payment Details */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              تفاصيل الدفع
            </h3>
            <div className="space-y-2">
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
          </div>
          <hr />
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

        {/* Print Button (Hidden during print) */}
        <div className="print-hidden text-center mt-6">
          <button
            onClick={() => window.print()}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            طباعة الفاتورة
          </button>
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
