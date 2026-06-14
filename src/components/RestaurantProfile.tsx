'use client';
import React, { useState } from 'react';
// import Image from 'next/image';
import { MapPin, Phone, Mail, User, Calendar, Edit, Save, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ValidationErrors, RestaurantProfileProps } from '@/lib/types/types';
import { formatDate, getInitials } from '@/lib/utils';

// Form data interface for better type safety
interface FormData {
  owner_name: string;
  restaurant_name: string;
  email: string;
  phone: string;
  address: string;
  logo_url: string;
}

const RestaurantProfile: React.FC<RestaurantProfileProps> = ({ restaurant, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState<FormData>({
    owner_name: restaurant.owner_name,
    restaurant_name: restaurant.restaurant_name,
    email: restaurant.email,
    phone: restaurant.phone,
    address: restaurant.address,
    logo_url: restaurant.logo_url || "",
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    return phoneRegex.test(phone);
  };


  const validateUrl = (url: string): boolean => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    if (formData.owner_name.length < 2) {
      newErrors.owner_name = "Owner name must be at least 2 characters";
    }
    if (formData.restaurant_name.length < 2) {
      newErrors.restaurant_name = "Restaurant name must be at least 2 characters";
    }
    if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid email address";
    }
    if (!validatePhone(formData.phone)) {
      newErrors.phone = "Invalid phone number";
    }
    if (formData.address.length < 10) {
      newErrors.address = "Address must be at least 10 characters";
    }
    if (formData.logo_url && !validateUrl(formData.logo_url)) {
      newErrors.logo_url = "Invalid logo URL";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setFormData({
      owner_name: restaurant.owner_name,
      restaurant_name: restaurant.restaurant_name,
      email: restaurant.email,
      phone: restaurant.phone,
      address: restaurant.address,
      logo_url: restaurant.logo_url || "",
    });
    setErrors({});
    setNotification(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      owner_name: restaurant.owner_name,
      restaurant_name: restaurant.restaurant_name,
      email: restaurant.email,
      phone: restaurant.phone,
      address: restaurant.address,
      logo_url: restaurant.logo_url || "",
    });
    setErrors({});
    setNotification(null);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev: FormData) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev: ValidationErrors) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showNotification('error', 'Please fix the validation errors before submitting.');
      return;
    }
    if (!onUpdate) return;

    setIsLoading(true);
    try {
      await onUpdate({
        ...formData,
        logo_url: formData.logo_url || null,
      });
      setIsEditing(false);
      showNotification('success', 'Your restaurant profile has been successfully updated.');
    } catch {
      showNotification('error', 'There was an error updating your profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {notification && (
          <Alert className={notification.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {notification.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={notification.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {notification.message}
            </AlertDescription>
          </Alert>
        )}
        <Card className="overflow-hidden border-0 shadow-xl">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                  <AvatarImage src={restaurant.logo_url || ""} alt={restaurant.restaurant_name} />
                  <AvatarFallback className="text-orange-500 text-lg font-bold">
                    {getInitials(restaurant.restaurant_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">{restaurant.restaurant_name}</h1>
                  <p className="text-orange-100 text-lg">Owner: {restaurant.owner_name}</p>
                  <Badge variant="secondary" className="mt-2">
                    <Calendar className="mr-1 h-3 w-3" />
                    Since {formatDate(restaurant.created_at)}
                  </Badge>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={isEditing ? handleCancel : handleEdit}
                className="bg-white/20 hover:bg-white/30 border-0"
                disabled={isLoading}
              >
                {isEditing ? (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-orange-500" />
                  Restaurant Information
                </CardTitle>
                <CardDescription>
                  {isEditing ? "Update your restaurant details below" : "Your current restaurant information"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Restaurant Name</label>
                        <Input
                          placeholder="Enter restaurant name"
                          value={formData.restaurant_name}
                          onChange={(e) => handleInputChange('restaurant_name', e.target.value)}
                          className={errors.restaurant_name ? 'border-red-500' : ''}
                        />
                        {errors.restaurant_name && (
                          <p className="text-sm text-red-500">{errors.restaurant_name}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Owner Name</label>
                        <Input
                          placeholder="Enter owner name"
                          value={formData.owner_name}
                          onChange={(e) => handleInputChange('owner_name', e.target.value)}
                          className={errors.owner_name ? 'border-red-500' : ''}
                        />
                        {errors.owner_name && (
                          <p className="text-sm text-red-500">{errors.owner_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email Address</label>
                        <Input
                          type="email"
                          placeholder="Enter email address"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className={errors.email ? 'border-red-500' : ''}
                        />
                        {errors.email && (
                          <p className="text-sm text-red-500">{errors.email}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Phone Number</label>
                        <Input
                          placeholder="Enter phone number"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className={errors.phone ? 'border-red-500' : ''}
                        />
                        {errors.phone && (
                          <p className="text-sm text-red-500">{errors.phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Restaurant Address</label>
                      <Textarea
                        placeholder="Enter complete restaurant address"
                        className={`resize-none ${errors.address ? 'border-red-500' : ''}`}
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                      />
                      {errors.address && (
                        <p className="text-sm text-red-500">{errors.address}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Logo URL (Optional)</label>
                      <Input
                        placeholder="https://example.com/logo.png"
                        value={formData.logo_url}
                        onChange={(e) => handleInputChange('logo_url', e.target.value)}
                        className={errors.logo_url ? 'border-red-500' : ''}
                      />
                      {errors.logo_url && (
                        <p className="text-sm text-red-500">{errors.logo_url}</p>
                      )}
                    </div>
                    <Separator />
                    <div className="flex justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          Owner Name
                        </div>
                        <p className="font-medium">{restaurant.owner_name}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          Phone
                        </div>
                        <p className="font-medium">
                          <a href={`tel:${restaurant.phone}`} className="hover:text-orange-500 transition-colors">
                            {restaurant.phone}
                          </a>
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreference">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </div>
                      <p className="font-medium">
                        <a href={`mailto:${restaurant.email}`} className="hover:text-orange-500 transition-colors">
                          {restaurant.email}
                        </a>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        Restaurant Address
                      </div>
                      <p className="font-medium leading-relaxed">{restaurant.address}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="shadow-lg bg-gradient-to-br from-orange-500 to-red-500 text-white border-0">
              <CardHeader>
                <CardTitle>Restaurant ID</CardTitle>
                <CardDescription className="text-orange-100">
                  Unique identifier for your restaurant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Badge variant="secondary" className="font-mono text-xs break-all bg-white/20 hover:bg-white/30">
                    {restaurant.id}
                  </Badge>
                  <div className="text-center pt-2">
                    <div className="text-lg font-bold">{restaurant.restaurant_name}</div>
                    <div className="text-orange-100 text-sm">Digital Profile</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantProfile;