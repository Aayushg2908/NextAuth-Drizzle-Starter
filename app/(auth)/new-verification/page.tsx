"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { BeatLoader } from "react-spinners";
import { useCallback, useEffect } from "react";
import { newVerification } from "@/actions/auth";
import { toast } from "sonner";
import { CardWrapper } from "../card-wrapper";

const NewVerificationPage = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const onSubmit = useCallback(() => {
    if (!token) return;

    newVerification(token)
      .then((data) => {
        if (data.error) {
          toast.error(data.error);
        } else {
          toast.success(data.success!);
          router.push("/login");
        }
      })
      .catch((error) => {
        toast.error("Something went wrong!");
      });
  }, [token]);

  useEffect(() => {
    onSubmit();
  }, [onSubmit]);

  return (
    <CardWrapper
      headerLabel="Confirming your verification"
      backButtonLabel="Back to login"
      backButtonHref="/sign-in"
    >
      <div className="flex items-center w-full justify-center">
        <BeatLoader color="#ffffff" />
      </div>
    </CardWrapper>
  );
};

export default NewVerificationPage;
