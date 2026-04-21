import { redirect } from "next/navigation"

// /account defaults to the orders tab.
export default function AccountIndex() {
  redirect("/account/orders")
}
