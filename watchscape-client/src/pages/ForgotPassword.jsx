import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate(); // added for redirect

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      alert('Password reset email sent!');
      navigate("/"); // redirect to Landing page after alert
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form onSubmit={handleReset} className="bg-white p-6 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
        <input
          type="email" 
          placeholder="Enter your email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />
        <button className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 w-full">
          Send Reset Email
        </button>
        <p className="mt-3 text-sm text-gray-600">
          Note:  you will receive an email to reset your password. Please check your spam/junk folders if you don't see the email.
        </p>
        <div className="mt-4 text-sm text-center">
          <a
            href="/"
            className="text-gray-600 hover:text-yellow-500 hover:underline"
          >
            Back to Landing Page
          </a>
        </div>
      </form>
    </div>
  );
}
