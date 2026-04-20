import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Landmark,
  AlertCircle,
} from "lucide-react";
import { loginUser } from "../services/authService";

import { z } from "zod";
import toast from "react-hot-toast";

/* =============================
   ZOD VALIDATION SCHEMA
============================= */

const loginSchema = z.object({
  email: z.string().email("Enter valid email"),
  password: z.string().min(6, "Minimum 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] =
    useState<LoginFormData>({
      email: "",
      password: "",
    });

  const [errors, setErrors] =
    useState<Record<string, string>>({});

  const [showPassword, setShowPassword] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

/* =============================
   HANDLE INPUT CHANGE
============================= */

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

/* =============================
   HANDLE LOGIN (FRONTEND ONLY)
============================= */

const handleSubmit = async (
  e: React.FormEvent
) => {

  e.preventDefault();

  const result =
    loginSchema.safeParse(formData);

  if (!result.success) {

    const fieldErrors:
      Record<string, string> = {};

    result.error.issues.forEach(
      (err) => {

        if (err.path[0]) {

          fieldErrors[
            err.path[0].toString()
          ] = err.message;

        }
      }
    );

    setErrors(fieldErrors);

    return;
  }

  try {

    setIsLoading(true);

    const response =
      await loginUser(formData);

    localStorage.setItem(
      "token",
      response.token
    );

    localStorage.setItem(
      "user",
      JSON.stringify(response.user)
    );

    toast.success(
      "Login successful"
    );

    navigate("/dashboard");

  } catch (error: any) {

    toast.error(
      error.response?.data?.message ||
      "Login failed"
    );

  } finally {

    setIsLoading(false);

  }
};

/* =============================
   UI
============================= */

  return (

    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-100 px-4">

      {/* CARD */}

      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-6 sm:p-8">

        {/* HEADER */}

        <div className="text-center mb-6">

          <div className="mx-auto w-14 h-14 flex items-center justify-center bg-green-600 rounded-xl shadow">

            <Landmark className="text-white w-7 h-7" />

          </div>

          <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-gray-900">

            KITE Microfinance

          </h2>

          <p className="text-gray-500 text-sm mt-1">

            Secure member login portal

          </p>

        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {/* EMAIL */}

          <div>

            <label className="text-sm font-medium text-gray-700">

              Email address

            </label>

            <div className="relative mt-1">

              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />

              <input
                name="email"
                type="email"
                placeholder="member@agpa.co.tz"
                value={formData.email}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-3 rounded-lg border ${
                  errors.email
                    ? "border-red-500"
                    : "border-gray-300"
                } focus:ring-2 focus:ring-green-500 outline-none`}
              />

            </div>

            {errors.email && (

              <p className="text-sm text-red-600 flex gap-1 mt-1">

                <AlertCircle size={14} />

                {errors.email}

              </p>

            )}

          </div>

          {/* PASSWORD */}

          <div>

            <label className="text-sm font-medium text-gray-700">

              Password

            </label>

            <div className="relative mt-1">

              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />

              <input
                name="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full pl-10 pr-10 py-3 rounded-lg border ${
                  errors.password
                    ? "border-red-500"
                    : "border-gray-300"
                } focus:ring-2 focus:ring-green-500 outline-none`}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                className="absolute right-3 top-3"
              >

                {showPassword ? (

                  <EyeOff size={18} />

                ) : (

                  <Eye size={18} />

                )}

              </button>

            </div>

            {errors.password && (

              <p className="text-sm text-red-600 flex gap-1 mt-1">

                <AlertCircle size={14} />

                {errors.password}

              </p>

            )}

          </div>

          {/* BUTTON */}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-2 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
          >

            {isLoading ? (

              "Signing in..."

            ) : (

              <>
                <LogIn size={18} />
                Sign In
              </>

            )}

          </button>

        </form>

        {/* FOOTER */}

        <div className="text-center mt-6 text-sm">

          Don’t have account?{" "}

          <Link
            to="/register"
            className="text-green-600 font-medium"
          >

            Register

          </Link>

          <br />

          <Link
            to="/"
            className="text-gray-500 hover:text-green-600"
          >

            ← Back to home

          </Link>

        </div>

      </div>

    </div>
  );
};

export default Login;