import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

const TestPage = async () => {
  const session = await auth();

  return (
    <div className="h-full w-full flex flex-col items-center justify-center">
      This is a protected page <br /> {JSON.stringify(session?.user)}
      <form
        action={async () => {
          "use server";

          await signOut({ redirectTo: "/sign-in" });
        }}
      >
        <Button type="submit">Sign Out</Button>
      </form>
    </div>
  );
};

export default TestPage;
