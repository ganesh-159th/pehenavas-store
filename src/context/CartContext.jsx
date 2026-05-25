/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useRef } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    // 1. Initialize from localStorage (if data exists)
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('pehenavas_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);
    const toastTimeoutRef = useRef(null);

    // 2. Automatically save to localStorage whenever the cart changes
    useEffect(() => {
        localStorage.setItem('pehenavas_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product, size) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id && item.size === size);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === product.id && item.size === size
                        ? { ...item, qty: item.qty + 1 }
                        : item
                );
            }
            return [...prevCart, { ...product, size, qty: 1 }];
        });

        // Trigger global toast
        setToastMessage(`${product.name} added to cart!`);
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
        }
        toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3000);
    };

    const hideToast = () => setToastMessage(null);

    const removeFromCart = (id, size) => {
        setCart(prevCart => prevCart.filter(item => !(item.id === id && item.size === size)));
    };

    const updateItemQuantity = (id, size, qty) => {
        if (qty < 1) {
            removeFromCart(id, size);
            return;
        }
        setCart(prevCart => prevCart.map(item =>
            item.id === id && item.size === size
                ? { ...item, qty }
                : item
        ));
    };

    const clearCart = () => setCart([]);

    const cartTotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);

    return (
        <CartContext.Provider value={{ cart, isCartOpen, setIsCartOpen, addToCart, removeFromCart, updateItemQuantity, clearCart, cartTotal, toastMessage, hideToast }}>
            {children}
        </CartContext.Provider>
    );
};