import { useDispatch } from 'react-redux';
import Button from '../../ui/Button';
import { increaseItemQuality, decreaseItemQuality } from './cartSlice';

function UpdateQuantity({ pizzaId, currentQuantity }) {
  const dispatch = useDispatch();
  return (
    <div className="flex items-center gap-2 md:gap-3">
      <Button
        type={'round'}
        onClick={() => dispatch(decreaseItemQuality(pizzaId))}
      >
        -
      </Button>
      <span className="font-med text-sm">{currentQuantity}</span>
      <Button
        type={'round'}
        onClick={() => dispatch(increaseItemQuality(pizzaId))}
      >
        +
      </Button>
    </div>
  );
}

export default UpdateQuantity;
