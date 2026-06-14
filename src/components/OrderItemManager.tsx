'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Clock, ChefHat, CheckCircle, XCircle, Package, Loader2 } from 'lucide-react';
import { 
  OrderWithItems, 
  OrderItemStatus, 
  updateOrderItemStatus, 
  getStatusColor
} from '@/lib/api/orderItems';

interface OrderItemManagerProps {
  order: OrderWithItems;
  onOrderUpdate: () => void;
}

const OrderItemManager: React.FC<OrderItemManagerProps> = ({ order, onOrderUpdate }) => {
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [etaChoices, setEtaChoices] = useState<Record<string, number>>({});

  const ETA_PRESETS = [5, 10, 15, 20, 25, 30];

  const handleItemStatusUpdate = async (itemId: string, status: OrderItemStatus, eta?: number) => {
    setUpdatingItems(prev => new Set(prev).add(itemId));
    
    try {
      const result = await updateOrderItemStatus(order.order.id, itemId, {
        status,
        etaMinutes: eta,
        notes: `Updated to ${status}${eta ? ` (ETA: ${eta}min)` : ''}`
      });

      if (result.success) {
        onOrderUpdate(); // Refresh the order data
      } else {
        console.error('Failed to update item status:', result.error);
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('Error updating item status:', error);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const getStatusIcon = (status: OrderItemStatus) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'preparing': return <ChefHat className="h-4 w-4" />;
      case 'ready': return <Package className="h-4 w-4" />;
      case 'served': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getNextStatus = (currentStatus: OrderItemStatus): OrderItemStatus | null => {
    switch (currentStatus) {
      case 'pending': return 'confirmed';
      case 'confirmed': return 'preparing';
      case 'preparing': return 'ready';
      case 'ready': return 'served';
      default: return null;
    }
  };

  const getStatusButtonText = (status: OrderItemStatus): string => {
    switch (status) {
      case 'pending': return 'Confirm';
      case 'confirmed': return 'Start Preparing';
      case 'preparing': return 'Mark Ready';
      case 'ready': return 'Mark Served';
      case 'served': return 'Served';
      case 'cancelled': return 'Cancelled';
      default: return 'Update';
    }
  };

  const getStatusButtonVariant = (status: OrderItemStatus): string => {
    switch (status) {
      case 'pending': return 'bg-yellow-500 hover:bg-yellow-600 text-white';
      case 'confirmed': return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'preparing': return 'bg-purple-500 hover:bg-purple-600 text-white';
      case 'ready': return 'bg-green-500 hover:bg-green-600 text-white';
      case 'served': return 'bg-gray-500 hover:bg-gray-600 text-white';
      case 'cancelled': return 'bg-red-500 hover:bg-red-600 text-white';
      default: return 'bg-gray-500 hover:bg-gray-600 text-white';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              Order #{order.order.track_code}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {order.order.table?.table_number ? `Table ${order.order.table.table_number}` : 'No table'} • {order.stats.totalItems} items
            </p>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="text-sm">
              {order.order.status}
            </Badge>
            <p className="text-xs text-gray-500 mt-1">
              ₹{order.order.total_amount.toFixed(2)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Order Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-yellow-50 p-2 rounded text-center">
            <div className="font-semibold text-yellow-800">{order.stats.statusCounts.pending || 0}</div>
            <div className="text-yellow-600">Pending</div>
          </div>
          <div className="bg-purple-50 p-2 rounded text-center">
            <div className="font-semibold text-purple-800">{order.stats.statusCounts.preparing || 0}</div>
            <div className="text-purple-600">Preparing</div>
          </div>
          <div className="bg-green-50 p-2 rounded text-center">
            <div className="font-semibold text-green-800">{order.stats.statusCounts.ready || 0}</div>
            <div className="text-green-600">Ready</div>
          </div>
          <div className="bg-gray-50 p-2 rounded text-center">
            <div className="font-semibold text-gray-800">{order.stats.statusCounts.served || 0}</div>
            <div className="text-gray-600">Served</div>
          </div>
        </div>

        <Separator />

        {/* Individual Items */}
        <div className="space-y-3">
          {order.items?.length > 0 ? order.items.map((item) => {
            const isUpdating = updatingItems.has(item.id);
            const nextStatus = getNextStatus(item.status);
            const eta = etaChoices[item.id] ?? 15;

            return (
              <div key={item.id} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {item.menu_item?.name || 'Unknown Item'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Qty: {item.quantity} × ₹{item.price.toFixed(2)} = ₹{(item.quantity * item.price).toFixed(2)}
                    </p>
                    {item.notes && (
                      <p className="text-xs text-gray-500 mt-1 italic">&ldquo;{item.notes}&rdquo;</p>
                    )}
                  </div>
                  <Badge className={`${getStatusColor(item.status)} text-xs`}>
                    {getStatusIcon(item.status)}
                    <span className="ml-1 capitalize">{item.status}</span>
                  </Badge>
                </div>

                {/* ETA Selection for preparing items */}
                {item.status === 'confirmed' && (
                  <div className="mb-3">
                    <label className="text-xs text-gray-600 mb-1 block">Estimated Time:</label>
                    <select
                      value={eta}
                      onChange={(e) => setEtaChoices(prev => ({ ...prev, [item.id]: Number(e.target.value) }))}
                      className="text-xs border border-slate-300 bg-white text-gray-900 rounded px-2 py-1 transition-colors hover:border-slate-400"
                    >
                      {ETA_PRESETS.map((minutes) => (
                        <option key={minutes} value={minutes}>
                          {minutes} min{minutes > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {nextStatus && (
                    <Button
                      size="sm"
                      onClick={() => handleItemStatusUpdate(item.id, nextStatus, eta)}
                      disabled={isUpdating}
                      className={`${getStatusButtonVariant(item.status)} text-xs`}
                    >
                      {isUpdating ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        getStatusIcon(nextStatus)
                      )}
                      <span className="ml-1">
                        {isUpdating ? 'Updating...' : getStatusButtonText(nextStatus)}
                      </span>
                    </Button>
                  )}

                  {item.status !== 'cancelled' && item.status !== 'served' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleItemStatusUpdate(item.id, 'cancelled')}
                      disabled={isUpdating}
                      className="text-red-600 border-red-300 text-xs"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No items found for this order.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderItemManager;