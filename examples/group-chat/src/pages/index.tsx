"use client";
import { Field, Form, Formik } from "formik";
import Router from "next/router";
import React, { HTMLInputTypeAttribute } from "react";
import styles from "../styles/Home.module.css";

interface FormValues {
  displayName: string;
  color: string;
  roomId: string;
}

interface FormFieldProps {
  name: string;
  labeltext: string;
  placeholder?: string;
  type: HTMLInputTypeAttribute;
  error?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  name,
  labeltext,
  type,
  error,
}) => {
  return (
    <div className={styles.formGroup}>
      <label htmlFor={name}>{labeltext}</label>
      <Field type={type} name={name} className={styles.formControl} />
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
};

export default function Home() {
  const buildRedirectUrl = (values: FormValues) => {
    return `/room?roomId=${encodeURIComponent(
      values.roomId
    )}&name=${encodeURIComponent(
      values.displayName
    )}&color=${encodeURIComponent(values.color.split("#")[1] || "008080")}`;
  };

  return (
    <div className={styles.container}>
      <Formik
        initialValues={{ displayName: "", color: "#008080", roomId: "" }}
        validate={(values) => {
          const errors: { [key in keyof Partial<FormValues>]: string } = {};

          if (!values.roomId) {
            errors.roomId =
              "Room ID is required! This is the id of your document";
          }

          if (!values.displayName) {
            errors.displayName = `Please set a name, other people will see your name cursor`;
          }

          return errors;
        }}
        onSubmit={({ ...values }) => {
          Router.push(buildRedirectUrl(values));
        }}
      >
        {({ errors, touched }) => (
          <Form className={styles.form}>
            <h2>Join the Room</h2>
            <FormField
              labeltext="Your Name"
              name="displayName"
              type="text"
              error={touched.displayName ? errors.displayName : undefined}
            />

            <FormField
              labeltext="Chat Room Name (this is roomId)"
              name="roomId"
              type="text"
              error={touched.roomId ? errors.roomId : undefined}
            />

            <button type="submit" className={styles.formSubmit}>
              Continue
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
