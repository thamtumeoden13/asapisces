"use client";

import React, { Suspense, useState, useEffect } from "react";
import emailjs from "@emailjs/browser";
// import Loader from "@/components/portfolio/Loader";
import { Canvas } from "@react-three/fiber";
import Fox from "@/models/Fox";

import useAlert from "@/hooks/useAlert";
import Alert from "@/components/portfolio/Alert";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState("idle");

  const { alert, showAlert, hideAlert } = useAlert();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setCurrentAnimation("hit");

    emailjs
      .send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
        {
          from_name: form.name,
          to_name: "MR.Vu",
          from_email: form.email,
          to_email: "ltv.mrvu@gmail.com",
          message: form.message,
        },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
      )
      .then(() => {
        showAlert({
          show: true,
          text: "Message sent successfully!",
          type: "success",
        });
      })
      .catch((error) => {
        console.log(error);
        showAlert({
          show: true,
          text: "I didn't receive your message",
          type: "danger",
        });
      })
      .finally(() => {
        setIsLoading(false);
        setCurrentAnimation("idle");
      });
  };

  const handleFocus = () => setCurrentAnimation("walk");

  const handleBlur = () => setCurrentAnimation("idle");

  useEffect(() => {
    if (!alert.show) return;
    setForm({ name: "", email: "", message: "" });

    const timeout = setTimeout(() => {
      hideAlert();
    }, 3000);

    return () => clearTimeout(timeout);
  }, [alert]);

  return (
    <section className="relative flex lg:flex-row flex-col max-container h-[100vh]">
      {alert.show && <Alert {...alert} />}

      <div className="flex-1 min-w-[50%] flex flex-col">
        <h1 className="head-text">Get in Touch</h1>

        <form
          className="flex flex-col w-ful gap-7 mt-14"
          onSubmit={handleSubmit}
        >
          <label className="font-semibold text-black-500">
            <p>Name</p>
            <input
              type="text"
              name="name"
              className="input"
              placeholder="John"
              required
              value={form.name}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </label>
          <label className="font-semibold text-black-500">
            <p>Email</p>
            <input
              type="email"
              name="email"
              className="input"
              placeholder="john@gmail.com"
              required
              value={form.email}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </label>
          <label className="font-semibold text-black-500">
            <p>Your Message</p>
            <textarea
              name="message"
              className="textarea"
              placeholder="let me know how I can help you!"
              required
              rows={5}
              value={form.message}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </label>
          <button
            type="submit"
            className="btn"
            disabled={isLoading}
            onFocus={handleBlur}
            onBlur={handleBlur}
          >
            {isLoading ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>
      <div className="lg:w-1/2 w-full lg:h-auto md:h-[550px] h-[350px]">
        <Canvas
          camera={{
            position: [0, 0, 5],
            fov: 75,
            near: 0.1,
            far: 1000,
          }}
        >
          <directionalLight intensity={2.5} position={[0, 0, 1]} />
          <ambientLight intensity={0.5} />

          {/* <Suspense fallback={<Loader />}> */}
          <Fox
            currentAnimation={currentAnimation}
            position={[0.5, 0.35, 0]}
            rotation={[12.6, -0.6, 0]}
            scale={[0.5, 0.5, 0.5]}
          />
          {/* </Suspense> */}
        </Canvas>
      </div>
    </section>
  );
};

export default Contact;
