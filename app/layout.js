export const metadata = {
  title: "Tour of the Bible",
  description: "Lightning-Fast One-Sitting Reading Plan — track your progress through every book of the Bible",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1B3A4B" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
