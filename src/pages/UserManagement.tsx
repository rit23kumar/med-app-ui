import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  FormControlLabel,
  DialogContentText,
} from '@mui/material';
import { userApi, UserRegistrationRequest, UserResponse } from '../api/userApi';
import { UserResponseDto } from '../types/User';
import { IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../contexts/AuthContext';

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  // State for Create New User form
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'USER' | ''>('');
  const [loading, setLoading] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [creationSuccess, setCreationSuccess] = useState<string | null>(null);

  // State for User Management table
  const [users, setUsers] = useState<UserResponseDto[]>([]);
  const [fetchUsersError, setFetchUsersError] = useState<string | null>(null);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [manageSuccessMessage, setManageSuccessMessage] = useState<string | null>(null);
  const [manageErrorMessage, setManageErrorMessage] = useState<string | null>(null);

  // State for Change Password dialog
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResponseDto | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  // State for Delete Confirmation dialog
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserResponseDto | null>(null);

  // Fetch users on component mount and after certain actions
  useEffect(() => {
    fetchUsers();
  }, []);

  // Add this useEffect after the other useEffect
  useEffect(() => {
    console.log('Success message changed:', manageSuccessMessage);
  }, [manageSuccessMessage]);

  const fetchUsers = async () => {
    setIsFetchingUsers(true);
    setFetchUsersError(null);
    setManageSuccessMessage(null);
    setManageErrorMessage(null);
    try {
      const response = await userApi.getAllUsers();
      console.log('Users response:', response);
      setUsers(response);
    } catch (err) {
      console.error('Error fetching users:', err);
      setFetchUsersError('Failed to fetch users.');
    } finally {
      setIsFetchingUsers(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setCreationError(null);
    setCreationSuccess(null);
    setManageSuccessMessage(null);
    setManageErrorMessage(null);

    if (!fullName || !username || !password || !role) {
      setCreationError('All fields are required.');
      setLoading(false);
      return;
    }

    if (username.length < 3 || username.length > 8) {
      setCreationError('Username must be between 3 and 8 characters.');
      setLoading(false);
      return;
    }

    const requestBody: UserRegistrationRequest = {
      fullName,
      username,
      password,
      role,
    };

    try {
      await userApi.registerUser(requestBody);
      setCreationSuccess('User created successfully!');
      setFullName('');
      setUsername('');
      setPassword('');
      setRole('');
      fetchUsers();
    } catch (err: any) {
      if (err.response && err.response.status === 400 && err.response.data.message === 'Username already exists') {
        setCreationError('Username already exists. Please choose a different username.');
      } else {
        setCreationError('Failed to create user. Please try again.');
      }
      console.error('Error creating user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    setCreationSuccess(null);
    setCreationError(null);
    setManageSuccessMessage(null);
    setManageErrorMessage(null);
    try {
      await userApi.updateUserStatus(userId, !currentStatus);
      fetchUsers();
      setManageSuccessMessage(`User status updated successfully!`);
    } catch (err) {
      console.error('Error updating user status:', err);
      setManageErrorMessage('Failed to update user status.');
    }
  };

  const handleChangePasswordClick = (user: UserResponseDto) => {
    setSelectedUser(user);
    setNewPassword('');
    setConfirmNewPassword('');
    setManageErrorMessage(null);
    setPasswordDialogOpen(true);
  };

  const handleClosePasswordDialog = () => {
    setPasswordDialogOpen(false);
    setSelectedUser(null);
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const handleConfirmPasswordChange = async () => {
    setChangePasswordLoading(true);
    setManageErrorMessage(null);
    setManageSuccessMessage(null);

    if (newPassword !== confirmNewPassword) {
      setManageErrorMessage('Passwords do not match.');
      setChangePasswordLoading(false);
      return;
    }
    if (!newPassword) {
      setManageErrorMessage('Password cannot be empty.');
      setChangePasswordLoading(false);
      return;
    }

    if (selectedUser) {
      try {
        await userApi.changeUserPassword(selectedUser.id, newPassword);
        console.log('Password changed successfully for user:', selectedUser.username);
        const successMsg = `Password for ${selectedUser.username} changed successfully!`;
        console.log('Setting success message:', successMsg);
        setManageSuccessMessage(successMsg);
        
        handleClosePasswordDialog();
        await fetchUsers();
        
        console.log('Current success message:', manageSuccessMessage);
      } catch (err) {
        console.error('Error changing password:', err);
        setManageErrorMessage('Failed to change password.');
      } finally {
        setChangePasswordLoading(false);
      }
    }
  };

  const handleDeleteClick = (user: UserResponseDto) => {
    setUserToDelete(user);
    setOpenDeleteConfirm(true);
  };

  const handleCloseDeleteConfirm = () => {
    setOpenDeleteConfirm(false);
    setUserToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      try {
        setLoading(true);
        await userApi.deleteUser(userToDelete.id);
        setManageSuccessMessage(`User ${userToDelete.username} deleted successfully!`);
        fetchUsers();
        handleCloseDeleteConfirm();
      } catch (err: any) {
        console.error('Failed to delete user:', err);
        setManageSuccessMessage(err.response?.data?.message || 'Failed to delete user.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
        <Typography component="h1" variant="h5" mb={3}>
          Create New User
        </Typography>
        {creationSuccess && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{creationSuccess}</Alert>}
        {creationError && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{creationError}</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }} autoComplete="off">
          <TextField
            margin="normal"
            required
            fullWidth
            id="fullName"
            label="Full Name"
            name="fullName"
            autoComplete="off"
            autoFocus
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="new-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            inputProps={{ minLength: 3, maxLength: 8 }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="role-label">Role</InputLabel>
            <Select
              labelId="role-label"
              id="role"
              value={role}
              label="Role"
              onChange={(e) => setRole(e.target.value as 'ADMIN' | 'USER')}
            >
              <MenuItem value="ADMIN">Admin</MenuItem>
              <MenuItem value="USER">User</MenuItem>
            </Select>
          </FormControl>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Create User'}
          </Button>
        </Box>
      </Paper>

      <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h2" variant="h5" mb={3}>
          Manage Existing Users
        </Typography>
        {manageSuccessMessage && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{manageSuccessMessage}</Alert>}
        {manageErrorMessage && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{manageErrorMessage}</Alert>}
        {isFetchingUsers && <CircularProgress sx={{ my: 2 }} />}
        {fetchUsersError && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{fetchUsersError}</Alert>}
        {!isFetchingUsers && !fetchUsersError && users.length === 0 && (
          <Typography color="text.secondary">No users found.</Typography>
        )}
        {!isFetchingUsers && users.length > 0 && (
          <Paper sx={{ p: 2, mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              User Management
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>Full Name</TableCell>
                    <TableCell>Roles</TableCell>
                    <TableCell>Enabled</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.fullName}</TableCell>
                      <TableCell>{user.role || 'USER'}</TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={user.enabled}
                              onChange={() => handleToggleStatus(user.id, user.enabled)}
                              name="enabled-switch"
                              disabled={user.username === currentUser?.username}
                            />
                          }
                          label={user.enabled ? 'Enabled' : 'Disabled'}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleChangePasswordClick(user)}
                          sx={{ mr: 1 }}
                          disabled={user.username === currentUser?.username}
                        >
                          Change Password
                        </Button>
                        <IconButton
                          onClick={() => handleDeleteClick(user)}
                          disabled={user.username === currentUser?.username}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Paper>

      <Dialog 
        open={passwordDialogOpen} 
        onClose={handleClosePasswordDialog}
        onKeyPress={(e) => {
          if (e.key === 'Enter' && !changePasswordLoading) {
            e.preventDefault();
            handleConfirmPasswordChange();
          }
        }}
      >
        <DialogTitle>Change Password for {selectedUser?.username}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter the new password for the selected user.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="newPassword"
            label="New Password"
            type="password"
            fullWidth
            variant="standard"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('confirmNewPassword')?.focus();
              }
            }}
          />
          <TextField
            margin="dense"
            id="confirmNewPassword"
            label="Confirm New Password"
            type="password"
            fullWidth
            variant="standard"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !changePasswordLoading) {
                e.preventDefault();
                handleConfirmPasswordChange();
              }
            }}
          />
          {changePasswordLoading && <CircularProgress size={20} />}
          {changePasswordLoading && manageErrorMessage && <Alert severity="error" sx={{ mt: 1 }}>{manageErrorMessage}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasswordDialog}>Cancel</Button>
          <Button onClick={handleConfirmPasswordChange} disabled={changePasswordLoading}>
            {changePasswordLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDeleteConfirm} onClose={handleCloseDeleteConfirm}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete user "{userToDelete?.username}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" disabled={loading}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement; 