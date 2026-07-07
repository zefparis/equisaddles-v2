import { useCart } from "../hooks/use-cart";
import { Button } from "../components/ui/button";

export default function TestClearCart() {
  const { items, clearCart } = useCart();

  const handleClearCart = () => {
    console.log('Before clear:', items);
    clearCart();
    localStorage.removeItem('equi-saddles-cart');
    console.log('After clear');
    window.location.reload();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Test Clear Cart</h1>
      <p className="mb-4">Items in cart: {items.length}</p>
      <Button onClick={handleClearCart}>
        Force Clear Cart
      </Button>
      <div className="mt-4">
        <pre>{JSON.stringify(items, null, 2)}</pre>
      </div>
    </div>
  );
}
