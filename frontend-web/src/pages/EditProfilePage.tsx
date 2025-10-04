import React, { useState, useEffect, useRef } from 'react';
import { Container, Button, Form, Alert, Spinner, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ImageCropModal from '../components/ImageCropModal';
import { getAvatarPlaceholder, getBannerPlaceholder } from '../utils/placeholderGenerator';
import styles from './EditProfilePage.module.css';

interface ProfileData {
    username: string;
    displayName?: string;
    description?: string;
    gender?: string;
    dob?: string;
    links?: { title: string; url: string }[];
    avatar_url?: string;
    banner_url?: string;
}

type ImageType = 'avatar' | 'banner';

const EditProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser, login } = useAuth();

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [description, setDescription] = useState('');
    const [gender, setGender] = useState('');
    const [dob, setDob] = useState('');
    const [links, setLinks] = useState<{ title: string; url: string }[]>([]);
    
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [validationError, setValidationError] = useState('');
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    // Upload progress states
    const [avatarUploadProgress, setAvatarUploadProgress] = useState(0);
    const [bannerUploadProgress, setBannerUploadProgress] = useState(0);
    const [avatarUploadStatus, setAvatarUploadStatus] = useState('');
    const [bannerUploadStatus, setBannerUploadStatus] = useState('');

    // Image editing state
    const [imageSrc, setImageSrc] = useState<string>('');
    const [imageType, setImageType] = useState<ImageType>('avatar');
    const [showCropModal, setShowCropModal] = useState(false);
    const [aspect, setAspect] = useState(1);

    // Previews
    const [avatarPreview, setAvatarPreview] = useState<string | undefined>(undefined);
    const [bannerPreview, setBannerPreview] = useState<string | undefined>(undefined);

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const [hasChanges, setHasChanges] = useState(false);

    // Function to handle updating profile state and JWT token
    const handleProfileUpdate = (newToken: string, updatedUser: any) => {
        login(newToken);
        setProfile(prev => ({
            ...(prev as ProfileData),
            ...updatedUser,
            avatar_url: updatedUser.avatar_url || prev?.avatar_url,
            banner_url: updatedUser.banner_url || prev?.banner_url,
        }));
        // Update previews immediately if the user object contains the new URLs
        if (updatedUser.avatar_url) setAvatarPreview(updatedUser.avatar_url);
        if (updatedUser.banner_url) setBannerPreview(updatedUser.banner_url);
    };

    useEffect(() => {
        if (validationError) {
            const timer = setTimeout(() => setValidationError(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [validationError]);

    useEffect(() => {
        if (profile) {
            const changed =
                username !== profile.username ||
                displayName !== (profile.displayName || '') ||
                description !== (profile.description || '') ||
                gender !== (profile.gender || '') ||
                dob !== (profile.dob || '') ||
                JSON.stringify(links) !== JSON.stringify(profile.links || []);
            setHasChanges(changed);
        }
    }, [username, displayName, description, gender, dob, links, profile]);

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        const fetchProfile = async () => {
            try {
                const response = await api.get(`/users/${currentUser.username}`);
                const p = response.data.user;
                setProfile(p);
                setUsername(p.username);
                setDisplayName(p.displayName || '');
                setDescription(p.description || '');
                setGender(p.gender || '');
                setDob(p.dob || '');
                setLinks(p.links || []);
                setAvatarPreview(p.avatar_url);
                setBannerPreview(p.banner_url);
            } catch (err) {
                console.error('Error fetching profile data:', err);
                setError('Failed to load profile data.');
            } finally {
                setPageLoading(false);
            }
        };
        fetchProfile();
    }, [currentUser, navigate]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: ImageType) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageSrc(reader.result as string);
                setImageType(type);
                setAspect(type === 'avatar' ? 1 / 1 : 16 / 9);
                setShowCropModal(true);
            });
            reader.readAsDataURL(file);
        }
    };

    const handleImageSave = async (croppedImage: Blob) => {
        const formData = new FormData();
        formData.append(imageType, croppedImage, `${imageType}.jpeg`);

        const setProgress = imageType === 'avatar' ? setAvatarUploadProgress : setBannerUploadProgress;
        const setStatus = imageType === 'avatar' ? setAvatarUploadStatus : setBannerUploadStatus;

        try {
            setStatus('Uploading...');
            setProgress(0);
            const response = await api.put('/users/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setProgress(percentCompleted);
                    }
                },
            });
            
            const previewUrl = URL.createObjectURL(croppedImage);
            if (imageType === 'avatar') {
                setAvatarPreview(previewUrl);
            } else {
                setBannerPreview(previewUrl);
            }

            if (response.data.token) {
                handleProfileUpdate(response.data.token, response.data.user);
            }

            setStatus('Upload successful!');
            setTimeout(() => {
                setStatus('');
                setProgress(0);
                setSuccess(`Your ${imageType} has been updated.`);
                setTimeout(() => setSuccess(''), 3000);
            }, 1500);

        } catch (err: any) {
            console.error(`Error updating ${imageType}:`, err);
            setStatus('Upload failed.');
            setError(err.response?.data?.message || `Failed to update ${imageType}.`);
            setTimeout(() => {
                setStatus('');
                setProgress(0);
            }, 3000);
        }
    };

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();

        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(username)) {
            setValidationError('Username must be 3-20 characters long and contain only letters, numbers, and underscores.');
            return;
        }

        if (!displayName.trim()) {
            setValidationError('Display Name cannot be empty.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        const formData = new FormData();
        let hasChanges = false;

        if (username !== profile?.username) {
            formData.append('username', username);
            hasChanges = true;
        }
        if (displayName !== profile?.displayName) {
            formData.append('displayName', displayName);
            hasChanges = true;
        }
        if (description !== profile?.description) {
            formData.append('description', description);
            hasChanges = true;
        }
        if (gender !== profile?.gender) {
            formData.append('gender', gender);
            hasChanges = true;
        }
        if (dob !== profile?.dob) {
            formData.append('dob', dob);
            hasChanges = true;
        }
        if (JSON.stringify(links) !== JSON.stringify(profile?.links)) {
            formData.append('links', JSON.stringify(links));
        }

        try {
            const response = await api.put('/users/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (response.data.token) {
                handleProfileUpdate(response.data.token, response.data.user);
            }
            setSuccess('Profile updated successfully!');
            if (username !== profile?.username) {
                navigate(`/profile/${username}`, { state: { refresh: true } });
            } else {
                navigate(`/profile/${username}`, { state: { refresh: true } });
            }

        } catch (err: any) {
            console.error('Error updating profile:', err);
            setError(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
            setTimeout(() => setSuccess(''), 3000);
        }
    };

    if (pageLoading) {
        return <Container className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}><Spinner animation="border" /></Container>;
    }

    return (
        <Container className="my-5">
            <h2 className="mb-4">Edit Profile</h2>

            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
            {validationError && <Alert variant="danger">{validationError}</Alert>}

            <div
                className={styles.bannerContainer}
                style={{ backgroundImage: `url(${bannerPreview || getBannerPlaceholder(displayName || username)})` }}
            >
                <div
                    className={styles.bannerImageUploader}
                    onClick={() => {
                        bannerInputRef.current?.click();
                    }}
                >
                    <div className={styles.uploadOverlay}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.icon}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
                        <span>Edit Banner</span>
                    </div>
                </div>
                <input
                    type="file"
                    ref={bannerInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, 'banner')}
                />
                {bannerUploadStatus && (
                    <div className={styles.uploadStatus}>
                        {bannerUploadStatus} {bannerUploadProgress > 0 && bannerUploadStatus === 'Uploading...' && `(${bannerUploadProgress}%)`}
                    </div>
                )}

                <div className={styles.avatarContainer}>
                    <div
                        className={styles.avatarImageUploader}
                        style={{ backgroundImage: `url(${avatarPreview || getAvatarPlaceholder(displayName || username)})` }}
                        onClick={() => avatarInputRef.current?.click()}
                    >
                        <div className={styles.uploadOverlay}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.icon}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
                        </div>
                    </div>
                    <input
                        type="file"
                        ref={avatarInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, 'avatar')}
                    />
                    {avatarUploadStatus && (
                        <div className={styles.uploadStatus}>
                            {avatarUploadStatus} {avatarUploadProgress > 0 && avatarUploadStatus === 'Uploading...' && `(${avatarUploadProgress}%)`}
                        </div>
                    )}
                </div>
            </div>

            <Form onSubmit={handleProfileSave} className="mt-4">
                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-4" controlId="formUsername">
                            <Form.Label className={styles.formLabel}>Username</Form.Label>
                            <Form.Control
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                className={styles.formControl}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-4" controlId="formDisplayName">
                            <Form.Label className={styles.formLabel}>Display Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Enter your display name"
                                className={styles.formControl}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-4" controlId="formGender">
                            <Form.Label className={styles.formLabel}>Gender</Form.Label>
                            <Form.Select value={gender} onChange={(e) => setGender(e.target.value)} className={styles.formControl}>
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                                <option value="prefer_not_to_say">Prefer not to say</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-4" controlId="formDob">
                            <Form.Label className={styles.formLabel}>Date of Birth</Form.Label>
                            <Form.Control
                                type="date"
                                value={dob}
                                onChange={(e) => setDob(e.target.value)}
                                className={styles.formControl}
                            />
                            <Form.Text className="text-muted">
                                Your age is used for content filtering and is not publicly displayed.
                            </Form.Text>
                        </Form.Group>
                    </Col>
                </Row>

                <Form.Group className="mb-4" controlId="formDescription">
                    <Form.Label className={styles.formLabel}>Profile Data (Description)</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={5}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Tell us about yourself. Markdown is supported."
                        className={styles.formControl}
                    />
                </Form.Group>

                <Form.Group className="mb-4" controlId="formLinks">
                    <Form.Label className={styles.formLabel}>Links</Form.Label>
                    {links.map((link, index) => (
                        <Row key={index} className="mb-2">
                            <Col md={5}>
                                <Form.Control
                                    type="text"
                                    placeholder="Title"
                                    value={link.title}
                                    onChange={(e) => {
                                        const newLinks = [...links];
                                        newLinks[index].title = e.target.value;
                                        setLinks(newLinks);
                                    }}
                                    className={styles.formControl}
                                />
                            </Col>
                            <Col md={5}>
                                <Form.Control
                                    type="url"
                                    placeholder="URL"
                                    value={link.url}
                                    onChange={(e) => {
                                        const newLinks = [...links];
                                        newLinks[index].url = e.target.value;
                                        setLinks(newLinks);
                                    }}
                                    className={styles.formControl}
                                />
                            </Col>
                            <Col md={2}>
                                <Button variant="danger" onClick={() => {
                                    const newLinks = [...links];
                                    newLinks.splice(index, 1);
                                    setLinks(newLinks);
                                }}>Remove</Button>
                            </Col>
                        </Row>
                    ))}
                    <Button variant="link" onClick={() => setLinks([...links, { title: '', url: '' }])}><i className="bi bi-plus-circle" style={{ fontSize: '1.5rem' }}></i></Button>
                </Form.Group>

                <div className="d-flex justify-content-end">
                    {hasChanges && (
                        <Button variant="primary" type="submit" className={`${styles.saveButton} ${validationError ? styles.shake : ''}`} disabled={loading}>
                            {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'Save Changes'}
                        </Button>
                    )}
                </div>
            </Form>

            <ImageCropModal
                show={showCropModal}
                onHide={() => setShowCropModal(false)}
                image={imageSrc}
                onSave={handleImageSave}
                aspect={aspect}
            />
        </Container>
    );
};

export default EditProfilePage;