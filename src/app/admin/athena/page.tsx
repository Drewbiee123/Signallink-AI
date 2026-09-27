import { notFound } from "next/navigation";
export default function AthenaAdminPage() {
  // No existing admin session provider: fail closed until one is integrated.
  notFound();
}
