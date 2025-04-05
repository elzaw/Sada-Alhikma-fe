import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom"; // For redirecting after login
import instance from "../../API/instance";
import toast from "react-hot-toast";
import { useAuth } from "../../Contexts/AuthContext";

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
    mode: "onChange", // التحقق من الصحة أثناء الكتابة
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login, isAuthenticated } = useAuth();

  const navigate = useNavigate(); // For redirecting after login

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await instance.post("/users/login", data);
      const { user, token } = response.data;

      // Store the token in localStorage or context
      login(response.data); // Update the authenticated state in the context

      // Store the token in localStorage or context

      localStorage.setItem("token", token);
      toast.success("تم تسجيل الدخول بنجاح!");

      // Redirect to dashboard or home page
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "حدث خطأ ما");
      toast.error(err.response?.data?.error || "حدث خطأ ما");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        <h1 className="text-center text-2xl font-bold text-indigo-600 sm:text-3xl">
          صدي الحكمة
        </h1>

        <p className="mx-auto mt-4 max-w-md text-center text-gray-500">
          مرحبًا بك في صدى الحكمة رحلتك تبدأ من هنا!
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 mb-0 space-y-4 rounded-lg p-4 shadow-lg sm:p-6 lg:p-8"
        >
          <p className="text-center text-lg font-medium">
            سجل الدخول لحسابك الشخصي
          </p>

          <div>
            <label htmlFor="username" className="sr-only">
              اسم المستخدم
            </label>

            <div className="relative">
              <input
                type="text"
                {...register("username", {
                  required: "اسم المستخدم مطلوب",
                  minLength: {
                    value: 3,
                    message: "يجب أن يكون اسم المستخدم على الأقل 3 أحرف",
                  },
                })}
                className="w-full rounded-lg border-gray-200 p-4 pe-12 text-sm shadow-xs"
                placeholder="ادخل اسم المستخدم"
              />
              {errors.username && (
                <p className="text-red-500 text-sm">
                  {errors.username.message}
                </p>
              )}
              <span className="absolute inset-y-0 end-0 grid place-content-center px-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="size-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="password" className="sr-only">
              كلمة المرور
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                {...register("password", { required: "كلمة المرور مطلوبة" })}
                className="w-full rounded-lg border-gray-200 p-4 pe-12 text-sm shadow-xs"
                placeholder="ادخل كلمة المرور"
              />
              {errors.password && (
                <p className="text-red-500 text-sm">
                  {errors.password.message}
                </p>
              )}
              <span
                className="absolute inset-y-0 end-0 grid place-content-center px-4 cursor-pointer"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6.343 17.657A8 8 0 1117.657 6.343m-1.414 1.414A8 8 0 106.343 17.657M12 9a3 3 0 11-3 3 3 3 0 013-3"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </span>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="block w-full rounded-lg bg-indigo-600 px-5 py-3 text-sm font-medium text-white"
          >
            {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
          </button>

          <p className="text-center text-sm text-gray-500">
            لا يوجد حساب{" "}
            <a className="underline" href="/register">
              سجل الان
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
