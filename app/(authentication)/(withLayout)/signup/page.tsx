import { SignupForm } from './form';
import styles from './page.module.scss';

export default function RegisterPage() {
  return (
    <div className={styles.signup}>
      <div>
        <h1>Sign up</h1>
        <SignupForm />
      </div>
    </div>
  );
}
