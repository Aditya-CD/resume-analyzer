import {type FormEvent, useState} from 'react'
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import {usePuterStore} from "~/lib/puter";
import {useNavigate} from "react-router";
import {convertPdfToImage} from "~/lib/pdf2img";
import {generateUUID} from "~/lib/utils";
import {prepareInstructions} from "../../constants";

const Upload = () => {
    const { auth, isLoading, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [currentStep, setCurrentStep] = useState(1);

    const handleFileSelect = (file: File | null) => {
        setFile(file)
    }

    const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file }: { companyName: string, jobTitle: string, jobDescription: string, file: File  }) => {
        setIsProcessing(true);
        setCurrentStep(1);

        setStatusText('Uploading the file...');
        const uploadedFile = await fs.upload([file]);
        if(!uploadedFile) return setStatusText('Error: Failed to upload file');

        setCurrentStep(2);
        setStatusText('Converting to image...');
        const imageFile = await convertPdfToImage(file);
        if(!imageFile.file) return setStatusText('Error: Failed to convert PDF to image');

        setCurrentStep(3);
        setStatusText('Uploading the image...');
        const uploadedImage = await fs.upload([imageFile.file]);
        if(!uploadedImage) return setStatusText('Error: Failed to upload image');

        setCurrentStep(4);
        setStatusText('Preparing data...');
        const uuid = generateUUID();
        const data = {
            id: uuid,
            resumePath: uploadedFile.path,
            imagePath: uploadedImage.path,
            companyName, jobTitle, jobDescription,
            feedback: '',
        }
        await kv.set(`resume:${uuid}`, JSON.stringify(data));

        setCurrentStep(5);
        setStatusText('Analyzing your resume with AI...');

        const feedback = await ai.feedback(
            uploadedFile.path,
            prepareInstructions({ jobTitle, jobDescription })
        )
        if (!feedback) return setStatusText('Error: Failed to analyze resume');

        const feedbackText = typeof feedback.message.content === 'string'
            ? feedback.message.content
            : feedback.message.content[0].text;

        data.feedback = JSON.parse(feedbackText);
        await kv.set(`resume:${uuid}`, JSON.stringify(data));
        
        setCurrentStep(6);
        setStatusText('Analysis complete! Redirecting to results...');
        console.log(data);
        
        setTimeout(() => {
            navigate(`/resume/${uuid}`);
        }, 1500);
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget.closest('form');
        if(!form) return;
        const formData = new FormData(form);

        const companyName = formData.get('company-name') as string;
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;

        if(!file) return;

        handleAnalyze({ companyName, jobTitle, jobDescription, file });
    }

    const ProcessingSteps = () => (
        <div className="w-full max-w-2xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    {[1, 2, 3, 4, 5, 6].map((step) => (
                        <div
                            key={step}
                            className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all duration-300 ${
                                currentStep >= step
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-gray-200 text-gray-500'
                            }`}
                        >
                            {currentStep > step ? (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                step
                            )}
                        </div>
                    ))}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${(currentStep / 6) * 100}%` }}
                    ></div>
                </div>
            </div>
            
            <div className="text-center">
                <div className="mb-6">
                    <div className="relative inline-block">
                        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {statusText}
                </h3>
                
                <div className="text-sm text-gray-600 space-y-1">
                    <p>Step {currentStep} of 6</p>
                    <p className="text-xs opacity-75">
                        {currentStep === 1 && "Securely uploading your resume..."}
                        {currentStep === 2 && "Converting PDF for better analysis..."}
                        {currentStep === 3 && "Processing image data..."}
                        {currentStep === 4 && "Setting up analysis parameters..."}
                        {currentStep === 5 && "AI is reviewing your resume against job requirements..."}
                        {currentStep === 6 && "Preparing your personalized feedback..."}
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <Navbar />

            <section className="container mx-auto px-4 py-12">
                <div className="max-w-6xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            AI-Powered Resume Analysis
                        </div>
                        
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                            Get Smart Feedback for Your
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Dream Job</span>
                        </h1>
                        
                        {isProcessing ? (
                            <div className="mt-12">
                                <ProcessingSteps />
                            </div>
                        ) : (
                            <>
                                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                                    Upload your resume and get an instant ATS score with personalized improvement recommendations
                                </p>
                                
                                {/* Features */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                                    <div className="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="text-left">
                                            <p className="font-semibold text-gray-900">ATS Score</p>
                                            <p className="text-sm text-gray-600">Instant compatibility check</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                                            </svg>
                                        </div>
                                        <div className="text-left">
                                            <p className="font-semibold text-gray-900">AI Analysis</p>
                                            <p className="text-sm text-gray-600">Powered by advanced AI</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-3 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="text-left">
                                            <p className="font-semibold text-gray-900">Custom Tips</p>
                                            <p className="text-sm text-gray-600">Tailored improvements</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Form Section */}
                    {!isProcessing && (
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                            {/* Left Column - Info & Benefits */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">Why Use Our AI Resume Analyzer?</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-start space-x-3">
                                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900 text-sm">ATS Compatibility Score</h4>
                                                <p className="text-gray-600 text-sm">Get an instant score showing how well your resume passes Applicant Tracking Systems</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start space-x-3">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900 text-sm">Keyword Optimization</h4>
                                                <p className="text-gray-600 text-sm">Discover missing keywords and phrases that match your target job description</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start space-x-3">
                                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900 text-sm">Actionable Improvements</h4>
                                                <p className="text-gray-600 text-sm">Receive specific, actionable recommendations to enhance your resume</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-start space-x-3">
                                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900 text-sm">Instant Results</h4>
                                                <p className="text-gray-600 text-sm">Get your analysis in under 2 minutes with detailed feedback report</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
                                    <h3 className="text-lg font-bold text-gray-900 mb-3">💡 Pro Tips</h3>
                                    <div className="space-y-3 text-sm text-gray-700">
                                        <p>• Make sure your resume is in PDF format for best results</p>
                                        <p>• Include the complete job description for accurate keyword matching</p>
                                        <p>• Our AI analyzes formatting, content, and ATS compatibility</p>
                                        <p>• Results include both strengths and improvement areas</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Right Column - Form */}
                            <div className="lg:col-span-3">
                                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
                                        <h2 className="text-2xl font-bold text-white">Start Your Analysis</h2>
                                        <p className="text-blue-100 mt-1">Fill in the details below to get personalized feedback</p>
                                    </div>
                            
                            <form id="upload-form" onSubmit={handleSubmit} className="p-6 space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label htmlFor="company-name" className="block text-sm font-semibold text-gray-700">
                                            Company Name
                                        </label>
                                        <input
                                            type="text"
                                            name="company-name"
                                            placeholder="e.g., Google, Microsoft, Apple"
                                            id="company-name"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                                            required
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label htmlFor="job-title" className="block text-sm font-semibold text-gray-700">
                                            Job Title
                                        </label>
                                        <input
                                            type="text"
                                            name="job-title"
                                            placeholder="e.g., Software Engineer, Product Manager"
                                            id="job-title"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="job-description" className="block text-sm font-semibold text-gray-700">
                                        Job Description
                                    </label>
                                    <textarea
                                        rows={6}
                                        cols={1000}
                                        name="job-description"
                                        placeholder="Paste the complete job description here to get the most accurate analysis..."
                                        id="job-description"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                                        required
                                    />
                                    <p className="text-xs text-gray-500">
                                        💡 Tip: Include requirements, skills, and qualifications for better analysis
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="uploader" className="block text-sm font-semibold text-gray-700">
                                        Upload Resume
                                    </label>
                                    <div className={`border-2 border-dashed rounded-lg transition-all duration-200 ${
                                        file 
                                            ? 'border-green-400 bg-green-50 p-4' 
                                            : 'border-gray-300 hover:border-blue-400 p-6'
                                    }`}>
                                        {!file ? (
                                            <div className="text-center">
                                                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                </div>
                                                <p className="text-sm font-medium text-gray-700 mb-1">
                                                    Drop your resume here or click to browse
                                                </p>
                                                <p className="text-xs text-gray-500 mb-3">
                                                    Supports PDF files up to 10MB
                                                </p>
                                                <FileUploader onFileSelect={handleFileSelect} />
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" clipRule="evenodd" />
                                                            <path fillRule="evenodd" d="M15 17H5v-2h10v2z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-green-800 font-medium text-sm">{file.name}</p>
                                                        <p className="text-green-600 text-xs">
                                                            {(file.size / 1024 / 1024).toFixed(2)} MB • PDF
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setFile(null)}
                                                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                                                >
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button
                                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                        type="submit"
                                        disabled={!file}
                                    >
                                        <span className="flex items-center justify-center space-x-2">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                                            </svg>
                                            <span>Analyze My Resume</span>
                                        </span>
                                    </button>
                                    
                                    {!file && (
                                        <p className="text-center text-sm text-gray-500 mt-2">
                                            Please upload your resume to continue
                                        </p>
                                    )}
                                </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </main>
    )
}
export default Upload