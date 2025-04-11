// API service for communicating with the backend

// Base API URL - change this to match your backend URL
const API_URL = 'http://localhost:5000/api';

// Helper function for API requests with better error handling
async function apiRequest(endpoint: string, method: string = 'GET', data: any = null) {
  console.log(`Making ${method} request to ${API_URL}${endpoint}`, data);
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'omit', // Change to 'omit' for testing without auth
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || `Server responded with status ${response.status}`;
      } catch {
        errorMessage = `Server responded with status ${response.status}`;
      }
      throw new Error(errorMessage);
    }
    
    return response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// User API calls
export const userApi = {
  login: (email: string, password: string) => 
    apiRequest('/users/login', 'POST', { email, password }),
  
  register: (userData: any) => 
    apiRequest('/users/register', 'POST', userData),
    
  getCurrentUser: () => 
    apiRequest('/users/me'),
    
  updateProfile: (userData: any) => 
    apiRequest('/users/me', 'PUT', userData),
};

// Medication API calls
export const medicationApi = {
  getAllMedications: () => 
    apiRequest('/meds'),
    
  getMedication: (id: string) => 
    apiRequest(`/meds/${id}`),
    
  createMedication: (medicationData: any) => 
    apiRequest('/meds', 'POST', medicationData),
    
  updateMedication: (id: string, medicationData: any) => 
    apiRequest(`/meds/${id}`, 'PUT', medicationData),
    
  deleteMedication: (id: string) => 
    apiRequest(`/meds/${id}`, 'DELETE'),
};

// Reminder API calls
export const reminderApi = {
  getAllReminders: () => 
    apiRequest('/reminders'),
    
  getReminder: (id: string) => 
    apiRequest(`/reminders/${id}`),
    
  createReminder: (reminderData: any) => 
    apiRequest('/reminders', 'POST', reminderData),
    
  updateReminder: (id: string, reminderData: any) => 
    apiRequest(`/reminders/${id}`, 'PUT', reminderData),
    
  deleteReminder: (id: string) => 
    apiRequest(`/reminders/${id}`, 'DELETE'),
    
  toggleReminderStatus: (id: string, enabled: boolean) => 
    apiRequest(`/reminders/${id}/toggle`, 'PATCH', { enabled }),
    
  // Function to save WhatsApp notification preference
  enableWhatsApp: (id: string, phoneNumber: string, enabled: boolean) => 
    apiRequest(`/reminders/${id}/whatsapp`, 'PATCH', { phoneNumber, enabled }),
}; 