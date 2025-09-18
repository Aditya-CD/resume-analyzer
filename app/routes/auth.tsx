import { use, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter"

export const meta = () => ([
    { title: "ClearPath | Auth" },
    { name: "description", content: "Login to your account" },
])

const auth = () => {
    const { isLoading, auth } = usePuterStore();
    const location = useLocation();
    const next = location.search.split('next=')[1];
    const navigate = useNavigate();

    useEffect(() => {
        if (auth.isAuthenticated) navigate(next);
    }, [auth.isAuthenticated, next])
    
  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen flex items-center justify-center">
        <div className="gradient-border shadow-lg">
            <section className="flex flex-col gap-8 bg-white p-10 rounded-2xl">
                <div className="flex flex-col items-centergap-4 text-center">
                    <h1>Welcome to ClearPath</h1>
                    <h2>Login to Continue Your Job Journey</h2>
                </div>

                <div>
                    { isLoading ? (
                        <button className="auth-button animate-pulse" disabled>
                            <p>Signing you in...</p>
                        </button>
                    ) : (
                        <>
                            {auth.isAuthenticated ?(
                                <button className="auth-button" onClick={auth.signOut}>
                                    <p>Log Out</p>
                                </button>
                            ) : (
                                <button className="auth-button" onClick={auth.signIn}>
                                    <p>Login</p>
                                </button>    
                            )}
                        </>    
                    )}
                </div>
            </section>
        </div>
    </main>
  )
}

export default auth