import React, { useState } from "react";
import { z } from "zod";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";

import {
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaLock,
  FaEnvelope,
} from "react-icons/fa";

import {
  Eye,
  EyeOff,
  Phone,
  Mail,
  Users,
  BookOpen,
} from "lucide-react";
import { registerUser } from "../services/authService";

/* =========================
   ZOD VALIDATION SCHEMA
========================= */

const registerSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),

  email: z
    .string()
    .email("Enter valid email")
    .endsWith("@gmail.com", "Email must end with @gmail.com"),

  phone: z.string().regex(
    /^255\d{9}$/,
    "Phone must start with 255 and contain 12 digits"
  ),

  location: z.string().min(2, "Location is required"),

  role: z.enum(["agent", "admin"]),

  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    role: "agent",
    password: "",
  });

  const [errors, setErrors] =
    useState<Partial<Record<keyof RegisterFormData, string>>>({});

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

/* =========================
   HANDLE CHANGE
========================= */

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {

    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    setErrors(prev => ({
      ...prev,
      [name]: "",
    }));
  };

/* =========================
   HANDLE SUBMIT
========================= */
const handleSubmit = async (e: React.FormEvent) => {

  e.preventDefault();

  const result = registerSchema.safeParse(formData);

  if (!result.success) {

    const fieldErrors:
      Partial<Record<keyof RegisterFormData, string>> = {};

    result.error.issues.forEach(err => {

      const field =
        err.path[0] as keyof RegisterFormData;

      fieldErrors[field] = err.message;
    });

    setErrors(fieldErrors);

    return;
  }

  try {

    setLoading(true);

    const response =
      await registerUser(formData);

    localStorage.setItem(
      "token",
      response.token
    );

    toast.success(
      "Account created successfully 🎉"
    );

    navigate("/dashboard");

  } catch (error: any) {

    toast.error(
      error.response?.data?.message ||
      "Registration failed"
    );

  } finally {

    setLoading(false);

  }
};

/* =========================
   INPUT STYLE
========================= */

const inputStyle =
  "w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500";

/* =========================
   UI START
========================= */

return (

<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-100 px-4">

<div className="w-full max-w-md">

{/* HEADER */}

<div className="text-center mb-8">

<div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4 shadow-lg">

<BookOpen className="w-8 h-8 text-white" />

</div>

<h1 className="text-3xl font-bold text-gray-900">
AGPA Microfinance
</h1>

<p className="text-gray-600">
Create your account
</p>

</div>

{/* CARD */}

<div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">

<form onSubmit={handleSubmit} className="space-y-5">

{/* FULL NAME */}

<div className="relative">

<FaUser className="absolute left-3 top-4 text-gray-400" />

<input
type="text"
name="fullName"
placeholder="Full Name"
value={formData.fullName}
onChange={handleChange}
className={inputStyle}
/>

{errors.fullName && (
<p className="text-red-500 text-sm mt-1">
{errors.fullName}
</p>
)}

</div>

{/* EMAIL */}

<div className="relative">

<FaEnvelope className="absolute left-3 top-4 text-gray-400" />

<input
type="email"
name="email"
placeholder="example@gmail.com"
value={formData.email}
onChange={handleChange}
className={inputStyle}
/>

{errors.email && (
<p className="text-red-500 text-sm mt-1">
{errors.email}
</p>
)}

</div>

{/* PHONE */}

<div className="relative">

<FaPhone className="absolute left-3 top-4 text-gray-400" />

<input
type="tel"
name="phone"
placeholder="255XXXXXXXXX"
value={formData.phone}
onChange={handleChange}
className={inputStyle}
/>

{errors.phone && (
<p className="text-red-500 text-sm mt-1">
{errors.phone}
</p>
)}

</div>

{/* LOCATION */}

<div className="relative">

<FaMapMarkerAlt className="absolute left-3 top-4 text-gray-400" />

<input
type="text"
name="location"
placeholder="Location (e.g. Dar es Salaam)"
value={formData.location}
onChange={handleChange}
className={inputStyle}
/>

{errors.location && (
<p className="text-red-500 text-sm mt-1">
{errors.location}
</p>
)}

</div>

{/* ROLE */}

<select
name="role"
value={formData.role}
onChange={handleChange}
className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
>

<option value="agent">
Agent
</option>

<option value="admin">
Admin
</option>

</select>

{/* PASSWORD */}

<div className="relative">

<FaLock className="absolute left-3 top-4 text-gray-400" />

<input
type={showPassword ? "text" : "password"}
name="password"
placeholder="Password"
value={formData.password}
onChange={handleChange}
className={inputStyle}
/>

<button
type="button"
onClick={() =>
setShowPassword(!showPassword)
}
className="absolute right-3 top-4 text-gray-400"
>

{showPassword
? <EyeOff size={18}/>
: <Eye size={18}/>
}

</button>

{errors.password && (
<p className="text-red-500 text-sm mt-1">
{errors.password}
</p>
)}

</div>

{/* SUBMIT */}

<button
type="submit"
disabled={loading}
className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition transform hover:scale-[1.02] disabled:opacity-50"
>

{loading
? "Registering..."
: "Create Account"}

</button>

</form>

{/* FOOTER */}

<div className="mt-6 text-center">

<p className="text-sm text-gray-600">

Already have an account?{" "}

<Link
to="/login"
className="text-green-600 hover:text-green-700 font-medium"
>

Sign in here

</Link>

</p>

</div>

</div>

{/* HELP SECTION */}

<div className="bg-white rounded-xl shadow-lg p-6 mt-6">

<h3 className="text-lg font-semibold text-gray-900 mb-4">

Need Help?

</h3>

<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">

<div className="flex items-start">

<Phone className="w-5 h-5 text-green-600 mr-2 mt-0.5" />

<div>
<p className="font-medium">Call Us</p>
<p className="text-gray-600">
+255 618 353 861
</p>
</div>

</div>

<div className="flex items-start">

<Mail className="w-5 h-5 text-green-600 mr-2 mt-0.5" />

<div>
<p className="font-medium">Email Us</p>
<p className="text-gray-600">
agpamicrofinance@gmail.com
</p>
</div>

</div>

<div className="flex items-start">

<Users className="w-5 h-5 text-green-600 mr-2 mt-0.5" />

<div>
<p className="font-medium">Office Hours</p>
<p className="text-gray-600">
Mon–Fri, 9AM–5PM
</p>
</div>

</div>

</div>

</div>

</div>

</div>

);

};

export default Register;