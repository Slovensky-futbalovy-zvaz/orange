/** Login stránka má vlastný layout — bez Sidebar */
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
