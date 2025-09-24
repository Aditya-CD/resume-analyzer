import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";

// SVG icon for the loading spinner
const LoadingSpinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

// SVG for a simple, generic logo
const AppLogo = () => (
    <svg className="h-12 w-12 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
);


export const meta = () => ([
    { title: "ClearPath | Authentication" },
    { name: "description", content: "Sign in to access your account" },
]);

// Renamed component to follow PascalCase convention for React components
const AuthPage = () => {
    const { isLoading, auth } = usePuterStore();
    const location = useLocation();
    const navigate = useNavigate();

    // Use URLSearchParams for a more robust way to get query parameters
    const next = new URLSearchParams(location.search).get('next') || '/';

    useEffect(() => {
        if (auth.isAuthenticated) {
            navigate(next);
        }
    }, [auth.isAuthenticated, next, navigate]);
    
    return (
        <main className="bg-gray-50 min-h-screen flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-sm">
                <div className="flex flex-col items-center mb-8">
                    <AppLogo />
                    <h1 className="text-3xl font-bold text-gray-800 mt-4">Welcome to ClearPath</h1>
                    <h2 className="text-md text-gray-500 mt-1">Sign in to continue your journey</h2>
                </div>
                
                <div className="bg-white p-8 rounded-2xl shadow-lg w-full">
                    {isLoading ? (
                        <button className="w-full flex justify-center items-center bg-blue-500 text-white font-semibold py-3 px-4 rounded-lg cursor-not-allowed opacity-75" disabled>
                            <LoadingSpinner />
                            Signing you in...
                        </button>
                    ) : (
                        auth.isAuthenticated ? (
                            <button className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300" onClick={auth.signOut}>
                                Sign Out
                            </button>
                        ) : (
                            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-300" onClick={auth.signIn}>
                                Sign In with Puter
                            </button>
                        )
                    )}
                </div>
                <p className="text-center text-xs text-gray-400 mt-6">
                    &copy; {new Date().getFullYear()} ClearPath. All rights reserved.
                </p>
            </div>
        </main>
    );
};

export default AuthPage;

