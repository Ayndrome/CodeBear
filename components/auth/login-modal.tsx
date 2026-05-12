"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Github, Mail, Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useTRPC } from "@/app/trpc/client";
import { authClient } from "@/lib/auth-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { LoadingScreen } from "../loader/loadingScreen";
const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type EmailFormData = z.infer<typeof emailSchema>;
type LoginFormData = z.infer<typeof loginSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

type LoginStep = "initial" | "password" | "signup" | "verify";

interface LoginModalProps {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  onRedirecting?: () => void;  // ✅ add this
}

export function LoginModal({ children, open, setOpen, onRedirecting }: LoginModalProps) {
  const [internalOpen, setInternalOpen] = useState(true);
  const [step, setStep] = useState<LoginStep>("initial");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { toast } = useToast();

  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = setOpen !== undefined ? setOpen : setInternalOpen;

  const trpc = useTRPC();

  const checkEmailMutation = useMutation(trpc.auth.checkEmail.mutationOptions());
  const signInMutation = useMutation(trpc.auth.signIn.mutationOptions());
  const signUpMutation = useMutation(trpc.auth.signUp.mutationOptions());

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleEmailSubmit = async (data: EmailFormData) => {
    setIsLoading(true);
    try {
      const result = await checkEmailMutation.mutateAsync(data);
      setUserEmail(data.email);

      if (result.exists) {
        // Check if user has password (credential account) or only OAuth
        if (result.hasPassword === false) {
          // User exists via OAuth but no password - ask them to use OAuth or create password
          toast({
            title: "Account exists via OAuth",
            description: "Please use GitHub to sign in, or create a password in settings.",
          });
          // Still show password field in case they set one previously
          setStep("password");
          loginForm.setValue("email", data.email);
        } else {
          // Existing user with password - show password field
          setStep("password");
          loginForm.setValue("email", data.email);
        }
      } else {
        // New user - go to signup
        setStep("signup");
        signUpForm.setValue("email", data.email);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to check email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await signInMutation.mutateAsync(data, {
        onSuccess: () => {
          toast({
            title: "Welcome back!",
            description: "You have been logged in successfully.",
          });
          setIsOpen(false);
          // Redirect to main dashboard
          window.location.href = "/organizations";
        },
        onError: (error: any) => {
          // Handle specific error cases
          const errorMessage = error.message || "";

          if (errorMessage.includes("Credential account not found")) {
            toast({
              title: "No password set",
              description: "This account was created with GitHub. Please sign in with GitHub or set a password in settings.",
              variant: "destructive",
            });
          } else if (errorMessage.includes("Invalid email or password")) {
            toast({
              title: "Invalid credentials",
              description: "Please check your email and password and try again.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Error",
              description: errorMessage || "Failed to sign in",
              variant: "destructive",
            });
          }
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (data: SignUpFormData) => {
    setIsLoading(true);
    try {
      await signUpMutation.mutateAsync(data, {
        onSuccess: (result: any) => {
          toast({
            title: "Account created!",
            description: "Please check your email to verify your account.",
          });

          // If email verification is not required, go to organizations
          // Otherwise show verify step
          if (result?.user?.emailVerified) {
            window.location.href = "/organizations";
          } else {
            setStep("verify");
          }
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        },
      });
    } finally {
      setIsLoading(false);
    }
  };




  const handleGitHubLogin = async () => {
    try {
      onRedirecting?.();
      setIsOpen(false);

      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/organizations",
      });
    } catch (error: any) {
      setIsRedirecting(false);
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with GitHub",
        variant: "destructive",
      });
      setIsOpen(true);
    }
  };

  const resetModal = () => {
    setStep("initial");
    emailForm.reset();
    loginForm.reset();
    signUpForm.reset();
    setUserEmail("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleBack = () => {
    if (step === "password" || step === "signup") {
      setStep("initial");
    } else if (step === "verify") {
      setStep("signup");
    }
  };

  // const handleClose = () => {
  //   resetModal();
  //   setIsOpen(false);
  // };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Only reset if the modal is closing
      resetModal();
    }
    setIsOpen(newOpen);
  };

  if (isRedirecting) return <LoadingScreen variant="signin" />;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange} >
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] border-none bg-[#0a0a0a] p-0 gap-0 flex flex-col rounded-4xl">
        <DialogHeader className="px-8 py-4">
          <DialogTitle className="text-white font-sans text-sm">
            Login
          </DialogTitle>
        </DialogHeader>
        <div className="bg-[#171719] p-15 flex flex-col min-h-[600px] rounded-4xl">
          {/* Logo */}
          <div className="mb-18">
            <Image src="/codedolphinn.svg" height={60} width={60} alt="CodeDolphin" />

          </div>

          {/* Header */}
          <DialogHeader className="text-left mb-8 relative">
            {step !== "initial" && (
              <button
                onClick={handleBack}
                className="absolute -left-2 -top-1 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <DialogTitle className="text-3xl font-bold text-white mb-2">
              {step === "initial" && "Log In"}
              {step === "password" && "Welcome back"}
              {step === "signup" && "Create your account"}
              {step === "verify" && "Verify your email"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {step === "password" && "Enter your password to continue"}
              {step === "signup" && "Fill in your details to get started"}
              {step === "verify" && "Check your email for a verification code"}
            </DialogDescription>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 space-y-4">
            {/* OAuth Buttons */}
            {step !== "verify" && (
              <>
                <Button
                  onClick={handleGitHubLogin}
                  className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white h-12 rounded-lg font-medium"
                  disabled={isLoading}
                >
                  <Image src="/github.svg" height={20} width={20} alt="GitHub" className="mr-2 h-5 w-5" />
                  Continue with GitHub
                </Button>



                <div className="relative">
                  <Separator className="bg-gray-700" />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#171719] px-2 text-xs text-gray-400">
                    Or
                  </span>
                </div>
              </>
            )}

            {/* Email Step */}
            {step === "initial" && (
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="flex gap-2">
                  <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Email"
                            className="
  neon-input
    relative
    bg-linear-gradient-to-b from-[#111] to-[#0b0b0b]
    
    text-white
    placeholder-gray-500
    h-12
    rounded-lg
    border border-gray-700
    
    transition-all duration-300
    focus:border-blue-400
    focus:shadow-[0_0_20px_rgba(0,70,255,0.8)]
    hover:shadow-[0_0_10px_rgba(0,70,255,0.8)]
    outline-none focus-visible:outline-none focus:ring-0 focus:ring-transparent

  "
                            {...field}
                            disabled={isLoading}
                          />

                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="bg-[#3a3b4088] hover:bg-[#3a3b40ce] text-white h-12 px-6 rounded-lg font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? "..." : "Login"}
                  </Button>
                </form>
              </Form>
            )}

            {/* Password Step */}
            {step === "password" && (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <div className="text-sm text-gray-400 mb-4">
                    {userEmail}
                  </div>
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              className="bg-[#0d0d0d] border-gray-700 text-white placeholder-gray-500 h-12 pr-10 rounded-lg focus-visible:ring-blue-500"
                              {...field}
                              disabled={isLoading}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-[#024BC3] hover:bg-[#0239a3] text-white h-12 rounded-lg font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </Form>
            )}

            {/* Signup Step */}
            {step === "signup" && (
              <Form {...signUpForm}>
                <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                  <FormField
                    control={signUpForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Full name"
                            className="bg-[#0d0d0d] border-gray-700 text-white placeholder-gray-500 h-12 rounded-lg focus-visible:ring-blue-500"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  <div className="text-sm text-gray-400">
                    {userEmail}
                  </div>
                  <FormField
                    control={signUpForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Password"
                              className="bg-[#0d0d0d] border-gray-700 text-white placeholder-gray-500 h-12 pr-10 rounded-lg focus-visible:ring-blue-500"
                              {...field}
                              disabled={isLoading}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signUpForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm password"
                              className="bg-[#0d0d0d] border-gray-700 text-white placeholder-gray-500 h-12 pr-10 rounded-lg focus-visible:ring-blue-500"
                              {...field}
                              disabled={isLoading}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-[#024BC3] hover:bg-[#0239a3] text-white h-12 rounded-lg font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </Form>
            )}

            {/* Verification Step */}
            {step === "verify" && (
              <div className="text-center space-y-4 py-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Check your email</h3>
                  <p className="text-gray-400 mt-2">
                    We've sent a verification link to {userEmail}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Click the link to verify your account and sign in
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setIsOpen(false);
                    // Redirect to login page so user can sign in after verification
                    window.location.href = "/login";
                  }}
                  className="w-full bg-[#024BC3] hover:bg-[#0239a3] text-white h-12 rounded-lg font-medium"
                >
                  Got it, thanks!
                </Button>
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="mt-8">
            <p className="text-xs text-center text-gray-500 w-full">
              By using CodeDolphin you agree to our{" "}
              <a href="#" className="text-gray-400 hover:text-white underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-gray-400 hover:text-white underline">
                Privacy Policy
              </a>
            </p>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>

  );



}
