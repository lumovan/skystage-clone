"use client";

import Header from "@/components/Header";
import { useState } from "react";

export default function BookShowPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    date: "",
    budget: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    alert("Thank you! We'll be in touch soon.");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <>
      <Header />

      <main className="pt-[70px] min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-8 py-20">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-medium mb-4 skystage-text-body text-gray-800">
              Book a drone show
            </h1>
            <p className="text-gray-600 skystage-text-body">
              Submit this form to get in touch with our team.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="text-center">
              <label className="block text-gray-700 mb-2 skystage-text-body">
                Name:
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-[300px] h-[40px] px-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 skystage-text-body"
                required
              />
            </div>

            {/* Email */}
            <div className="text-center">
              <label className="block text-gray-700 mb-2 skystage-text-body">
                Email Address:
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-[300px] h-[40px] px-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 skystage-text-body"
                required
              />
            </div>

            {/* Phone */}
            <div className="text-center">
              <label className="block text-gray-700 mb-2 skystage-text-body">
                Phone Number:
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-[300px] h-[40px] px-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 skystage-text-body"
                required
              />
            </div>

            {/* Location */}
            <div className="text-center">
              <label className="block text-gray-700 mb-2 skystage-text-body">
                Approximate Location (optional):
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-[300px] h-[40px] px-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 skystage-text-body"
              />
            </div>

            {/* Date */}
            <div className="text-center">
              <label className="block text-gray-700 mb-2 skystage-text-body">
                Approximate Date (optional):
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-[300px] h-[40px] px-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 skystage-text-body"
              />
            </div>

            {/* Budget */}
            <div className="text-center">
              <label className="block text-gray-700 mb-2 skystage-text-body">
                Budget (optional):
              </label>
              <select
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                className="w-[300px] h-[40px] px-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 skystage-text-body bg-white"
              >
                <option value="">Select budget range</option>
                <option value="under-10k">Under $10,000</option>
                <option value="10k-25k">$10,000 - $25,000</option>
                <option value="25k-50k">$25,000 - $50,000</option>
                <option value="50k-100k">$50,000 - $100,000</option>
                <option value="over-100k">Over $100,000</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="text-center pt-4">
              <button type="submit" className="skystage-button">
                <span className="skystage-button-text">Submit Booking Request</span>
              </button>
            </div>

            <p className="text-center text-gray-600 text-sm skystage-text-body mt-6">
              We will give you a call after you submit this form!
            </p>
          </form>
        </div>
      </main>
    </>
  );
}
