"use client"; // Ensures Recoil runs on the client side

import { RecoilRoot } from "recoil";

export default function RecoilRootWrapper({ children }) {
  return <RecoilRoot>{children}</RecoilRoot>;
}
