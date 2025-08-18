import { Order, NewOrderPayload } from '../types';
// The corrected, live server address you provided
const BASE_URL = 'http://localhost:3000';

/**
 * Fetches the summary data (sales, profit, expenses) from the live backend.
 * @param {string} date - 'today', 'yesterday', or 'YYYY-MM-DD'
 * @returns {Promise<object>} - The summary data object.
 */
export const getSummaryData = async (date = 'today') => {
  try {
    console.log(`Fetching LIVE summary for: ${date}`);
    
    const response = await fetch(`${BASE_URL}/api/summary?date=${date}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      totalSales: data.totalSales,
      totalOrders: 4, // Placeholder
      customers: 4,   // Placeholder
      growthRate: 23, // Placeholder
    };

  } catch (error) {
    console.error("Error fetching live summary data:", error);
    return {
      totalSales: 0,
      totalOrders: 0,
      customers: 0,
      growthRate: 0,
    };
  }
};

// Add this new function to your api.js file

export const getOrdersData = async () => {
  try {
    console.log(`Fetching LIVE orders...`);
    const response = await fetch(`${BASE_URL}/api/orders`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data; // Returns the array of orders

  } catch (error) {
    console.error("Error fetching live orders data:", error);
    return []; // Return an empty array on error
  }
};

// Add this new function to your api.js file

export const getCustomersData = async () => {
  try {
    console.log(`Fetching LIVE customers...`);
    const response = await fetch(`${BASE_URL}/api/customers`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data; // Returns the array of unique customers

  } catch (error) {
    console.error("Error fetching live customers data:", error);
    return []; // Return an empty array on error
  }
};

// Add this new function to your api.ts file

export const createNewOrder = async (orderData: NewOrderPayload) => {
  try {
    const response = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create order');
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating new order:", error);
    // Re-throw the error so the component can handle it
    throw error;
  }
};

export const deleteOrder = async (orderId: string) => {
  try {
    const response = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete order');
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting order:", error);
    throw error;
  }
};

export const updateOrder = async (orderId: string, updates: Partial<Order>) => {
  try {
    const response = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update order');
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating order:", error);
    throw error;
  }
};

export const updateOrderStatus = async (orderId: string, newStatus: string) => {
  try {
    const response = await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newStatus }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update status');
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
};

export const loginUser = async (credentials: any) => {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to log in');
    }

    return await response.json(); // This will return the { token } object
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

// We can add the register function for later use
export const registerUser = async (userData: any) => {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to register');
    }

    return await response.json();
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};

export const getExpensesData = async () => {
  try {
    console.log(`Fetching LIVE expenses...`);
    const response = await fetch(`${BASE_URL}/api/expenses`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data; // Returns the array of expenses

  } catch (error) {
    console.error("Error fetching live expenses data:", error);
    return []; // Return an empty array on error
  }
};

export const createNewExpense = async (expenseData: { item: string; category: string; amount: number; }) => {
  try {
    const response = await fetch(`${BASE_URL}/api/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expenseData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create expense');
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating new expense:", error);
    throw error;
  }
};

export const deleteExpense = async (expenseId: string) => {
  try {
    const response = await fetch(`${BASE_URL}/api/expenses/${expenseId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete expense');
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
};

export const updateExpense = async (expenseId: string, expenseData: { item: string; category: string; amount: number; }) => {
  try {
    const response = await fetch(`${BASE_URL}/api/expenses/${expenseId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expenseData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update expense');
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating expense:", error);
    throw error;
  }
};

export const getExpensesCsv = async () => {
  try {
    const response = await fetch(`${BASE_URL}/api/expenses/csv`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // We get the raw CSV data as a blob
    const blob = await response.blob();
    
    // Create a temporary URL for the blob
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary link element to trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up the temporary URL and link
    a.remove();
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error("Error downloading expenses CSV:", error);
    // You could show an error to the user here
  }
};