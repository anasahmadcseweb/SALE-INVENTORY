import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { ProductTable } from './ProductTable';
import { ProductModal } from './ProductModal';
import { ProductDrawer } from './ProductDrawer';
import { ConfirmationModal } from '../common/ConfirmationModal';

export const InventoryView: React.FC = () => {
  const { state, dispatch } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const handleOpenAdd = () => {
    setProductToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setProductToEdit(product);
    setModalOpen(true);
  };

  const handleSaveProduct = (
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (productToEdit) {
      dispatch({
        type: 'UPDATE_PRODUCT',
        product: {
          ...productToEdit,
          ...productData,
        },
      });
    } else {
      dispatch({
        type: 'ADD_PRODUCT',
        product: productData,
      });
    }
    setModalOpen(false);
    setProductToEdit(null);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      dispatch({
        type: 'DELETE_PRODUCT',
        productId: productToDelete.id,
      });
      setProductToDelete(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Product Table */}
      <ProductTable
        products={state.products}
        onOpenAddModal={handleOpenAdd}
        onOpenEditModal={handleOpenEdit}
        onOpenDrawer={(p) => dispatch({ type: 'OPEN_PRODUCT_DRAWER', product: p })}
        onConfirmDelete={(p) => setProductToDelete(p)}
      />

      {/* Add / Edit Modal */}
      <ProductModal
        isOpen={modalOpen}
        productToEdit={productToEdit}
        onClose={() => {
          setModalOpen(false);
          setProductToEdit(null);
        }}
        onSave={handleSaveProduct}
      />

      {/* Product Detail Drawer */}
      <ProductDrawer
        product={state.selectedProductForDrawer}
        onClose={() => dispatch({ type: 'OPEN_PRODUCT_DRAWER', product: null })}
        onEdit={(p) => {
          dispatch({ type: 'OPEN_PRODUCT_DRAWER', product: null });
          handleOpenEdit(p);
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!productToDelete}
        title="Delete this product?"
        message={`Are you sure you want to permanently remove "${productToDelete?.name}" from your inventory catalog? This cannot be undone.`}
        confirmLabel="Delete Product"
        cancelLabel="Keep Product"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  );
};
