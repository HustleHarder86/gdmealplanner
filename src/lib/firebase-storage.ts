import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  StorageError,
} from 'firebase/storage';
import { storage } from './firebase';

// Error handling
export const handleStorageError = (error: unknown): string => {
  if (error instanceof StorageError) {
    switch (error.code) {
      case 'storage/object-not-found':
        return 'File not found.';
      case 'storage/bucket-not-found':
        return 'Storage bucket not configured.';
      case 'storage/project-not-found':
        return 'Project not found.';
      case 'storage/quota-exceeded':
        return 'Storage quota exceeded.';
      case 'storage/unauthenticated':
        return 'Please sign in to upload files.';
      case 'storage/unauthorized':
        return 'You do not have permission to access this file.';
      case 'storage/retry-limit-exceeded':
        return 'Upload failed. Please try again.';
      case 'storage/invalid-checksum':
        return 'File upload corrupted. Please try again.';
      case 'storage/canceled':
        return 'Upload canceled.';
      case 'storage/invalid-event-name':
      case 'storage/invalid-url':
      case 'storage/invalid-argument':
        return 'Invalid file or configuration.';
      case 'storage/no-default-bucket':
        return 'Storage not properly configured.';
      case 'storage/cannot-slice-blob':
        return 'File cannot be processed. Please try a different file.';
      case 'storage/server-file-wrong-size':
        return 'File size mismatch. Please try again.';
      default:
        return `Storage error: ${error.message}`;
    }
  }
  return 'An unexpected error occurred. Please try again.';
};

// Helper to generate unique file names
const generateFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 9);
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  const cleanName = nameWithoutExt.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return `${cleanName}_${timestamp}_${randomString}.${extension}`;
};

// Upload recipe image
export const uploadRecipeImage = async (
  userId: string,
  recipeId: string,
  file: File
): Promise<string> => {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please upload an image file');
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image size must be less than 5MB');
    }

    const fileName = generateFileName(file.name);
    const storageRef = ref(storage, `recipes/${userId}/${recipeId}/${fileName}`);
    
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        uploadedBy: userId,
        originalName: file.name,
      },
    });

    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    throw new Error(handleStorageError(error));
  }
};

// Upload user profile image
export const uploadProfileImage = async (
  userId: string,
  file: File
): Promise<string> => {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please upload an image file');
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image size must be less than 5MB');
    }

    const fileName = generateFileName(file.name);
    const storageRef = ref(storage, `users/${userId}/profile/${fileName}`);
    
    // Delete old profile images
    await deleteUserProfileImages(userId);

    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        uploadedBy: userId,
        originalName: file.name,
      },
    });

    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    throw new Error(handleStorageError(error));
  }
};

// Delete recipe image
export const deleteRecipeImage = async (imageUrl: string): Promise<void> => {
  try {
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
  } catch (error) {
    // Ignore if file doesn't exist
    if (error instanceof StorageError && error.code === 'storage/object-not-found') {
      return;
    }
    throw new Error(handleStorageError(error));
  }
};

// Delete all recipe images
export const deleteRecipeImages = async (
  userId: string,
  recipeId: string
): Promise<void> => {
  try {
    const folderRef = ref(storage, `recipes/${userId}/${recipeId}`);
    const fileList = await listAll(folderRef);
    
    const deletePromises = fileList.items.map((item) => deleteObject(item));
    await Promise.all(deletePromises);
  } catch (error) {
    // Ignore if folder doesn't exist
    if (error instanceof StorageError && error.code === 'storage/object-not-found') {
      return;
    }
    throw new Error(handleStorageError(error));
  }
};

// Delete user profile images
const deleteUserProfileImages = async (userId: string): Promise<void> => {
  try {
    const folderRef = ref(storage, `users/${userId}/profile`);
    const fileList = await listAll(folderRef);
    
    const deletePromises = fileList.items.map((item) => deleteObject(item));
    await Promise.all(deletePromises);
  } catch (error) {
    // Ignore if folder doesn't exist
    if (error instanceof StorageError && error.code === 'storage/object-not-found') {
      return;
    }
    throw new Error(handleStorageError(error));
  }
};

// Upload temporary image (for processing)
export const uploadTempImage = async (
  userId: string,
  file: File
): Promise<{ url: string; path: string }> => {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please upload an image file');
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image size must be less than 5MB');
    }

    const sessionId = Date.now().toString();
    const fileName = generateFileName(file.name);
    const path = `temp/${userId}/${sessionId}/${fileName}`;
    const storageRef = ref(storage, path);
    
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        uploadedBy: userId,
        originalName: file.name,
        tempFile: 'true',
      },
    });

    const url = await getDownloadURL(snapshot.ref);
    return { url, path };
  } catch (error) {
    throw new Error(handleStorageError(error));
  }
};

// Delete temporary image
export const deleteTempImage = async (path: string): Promise<void> => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    // Ignore if file doesn't exist
    if (error instanceof StorageError && error.code === 'storage/object-not-found') {
      return;
    }
    throw new Error(handleStorageError(error));
  }
};