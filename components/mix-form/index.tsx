import Form from './Form';
import Modal from './Modal';

export type { MixFormProps } from './Form';

type InternalMixFormType = typeof Form;

export interface MixFormInterface extends InternalMixFormType {
  Modal: typeof Modal;
}

const MixForm = Form as MixFormInterface;

MixForm.Modal = Modal;

export default MixForm;
