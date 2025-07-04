import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useAuthStore } from '../../stores/authStore';
import { LoginFormData, SignupFormData } from '../../types';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, isLoading, error, clearError } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData & SignupFormData>();

  const onSubmit = async (data: LoginFormData | SignupFormData) => {
    clearError();
    
    try {
      if (isSignup) {
        const signupData = data as SignupFormData;
        await signUp(signupData.email, signupData.password, signupData.displayName);
        toast.success('Account created successfully!');
      } else {
        const loginData = data as LoginFormData;
        await signIn(loginData.email, loginData.password);
        toast.success('Welcome back!');
      }
      
      reset();
      onSuccess?.();
    } catch (error) {
      // Error is handled by the store
      console.error('Auth error:', error);
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    clearError();
    reset();
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          {isSignup ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {isSignup 
            ? 'Join Quran Quest to start your spiritual journey' 
            : 'Sign in to continue your Quran journey'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {isSignup && (
          <div>
            <Input
              {...register('displayName', { 
                required: 'Display name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' }
              })}
              type="text"
              placeholder="Display Name"
              error={errors.displayName?.message}
            />
          </div>
        )}

        <div>
          <Input
            {...register('email', { 
              required: 'Email is required',
              pattern: { 
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            type="email"
            placeholder="Email address"
            error={errors.email?.message}
          />
        </div>

        <div>
          <Input
            {...register('password', { 
              required: 'Password is required',
              minLength: { value: 6, message: 'Password must be at least 6 characters' }
            })}
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            error={errors.password?.message}
          />
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              {isSignup ? 'Creating Account...' : 'Signing In...'}
            </div>
          ) : (
            isSignup ? 'Create Account' : 'Sign In'
          )}
        </Button>
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={toggleMode}
          className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {isSignup 
            ? 'Already have an account? Sign in' 
            : "Don't have an account? Sign up"
          }
        </button>
      </div>

      {!isSignup && (
        <div className="text-center">
          <button
            type="button"
            className="text-sm text-gray-600 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
          >
            Forgot your password?
          </button>
        </div>
      )}
    </div>
  );
}; 