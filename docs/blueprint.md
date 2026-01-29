# **App Name**: FinTrack

## Core Features:

- User Authentication: Secure user login using email and password, persisting user data in local storage after successful authentication via POST to https://financial-control-9s01.onrender.com/login.
- Dashboard Summary: Display a summary of financial data including Income, Expenses, and Balance fetched from the API endpoint https://financial-control-9s01.onrender.com/summary?month=1&year=2026.
- Transaction List: List transactions fetched from https://financial-control-9s01.onrender.com/list-transaction, displaying each transaction with its details.
- Manual Transaction Creation: Enable users to manually create transactions by submitting data (userId, type, description, amount, date) to the API endpoint https://financial-control-9s01.onrender.com/create-transaction.
- Transaction Deletion: Implement functionality to delete a transaction by sending a DELETE request to https://financial-control-9s01.onrender.com/delte-transaction/(transactionId).
- CSV Upload for Transactions: Allow users to upload a CSV file to create multiple transactions via POST request to https://financial-control-9s01.onrender.com/import.
- End of Month Archiving: Persist the financial details into permanent storage when the user hits the end of month. Uses https://financial-control-9s01.onrender.com/close-month.

## Style Guidelines:

- Primary color: Deep blue (#3F51B5) to inspire confidence and security.
- Background color: Light gray (#F0F2F5) for a clean, professional backdrop.
- Accent color: Teal (#009688) to highlight key interactive elements.
- Body and headline font: 'PT Sans', a humanist sans-serif that provides a modern and slightly warm feel.
- Use material design icons for a consistent and modern look.
- Dashboard layout with clear sections for summary, transactions, and user settings.
- Subtle transitions and animations on data updates and interactions.