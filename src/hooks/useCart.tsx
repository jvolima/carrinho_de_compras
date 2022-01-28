import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productAlreadyInCart = cart.find((product) => product.id === productId);

      if(productAlreadyInCart) {
        const response = await api.get(`stock/${productId}`);
        const data = response.data;
        if(data.amount >= 1) {
          const productIndex = cart.findIndex((product) => product.id === productId);
          const newCart = [...cart];
          newCart[productIndex].amount = productAlreadyInCart.amount + 1;
          setCart(newCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
          return;
        } else {
          toast.error("Quantidade solicitada fora de estoque!")
        }
      }

      const productResponse = await api.get(`products/${productId}`);
      const dataProduct = productResponse.data;

      const response = await api.get(`stock/${productId}`);
      const data = response.data;

      if(data.amount >= 1) {
        const newProduct: Product = {
          title: dataProduct.title,
          price: dataProduct.price,
          id: dataProduct.id,
          image: dataProduct.image,
          amount: 1
        }
        setCart([...cart, newProduct])
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
        return;
      } else {
        toast.error("Quantidade solicitada fora de estoque!")
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const findProduct = cart.find((product) => product.id === productId) as Product;

      if(findProduct) {
        setCart(cart.filter(product => product.id !== findProduct.id));
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0) {
        return;
      }

      const response = await api.get(`stock/${productId}`);
      const data = response.data;

      if(amount > data.amount) {
        toast.error('Quantidade solicitada fora de estoque')
      }

      const product = cart.find((product) => product.id === productId) as Product;
      const productIndex = cart.indexOf(product);

      const newCart = [...cart];
      newCart[productIndex].amount = amount;
      setCart(newCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
