import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useGlobalContext } from '@/features/context/GlolbalContext';
import useUsuario from '@/features/hooks/useUsuario';
import { regionTexto } from '@/fuctions/regiones';
import ModalConfirmarLogout from '@/modals/ModalConfirmarLogout';
import { FiChevronDown, FiLogOut, FiChevronRight } from 'react-icons/fi';
import { MdAccountCircle, MdSchool, MdOutlineLocationOn, MdLayers } from 'react-icons/md';
import styles from './NavbarUserMenu.module.css';

const NavbarUserMenu = () => {
  const { currentUserData } = useGlobalContext();
  const { logout } = useUsuario();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // If there's no user data loaded yet, do not render trigger
  if (!currentUserData?.dni && !currentUserData?.nombres) {
    return null;
  }

  const toTitleCase = (str?: string) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getInitials = (nombres?: string, apellidos?: string) => {
    const n = (nombres || '').trim().split(' ')[0] || '';
    const a = (apellidos || '').trim().split(' ')[0] || '';
    const initial1 = n.charAt(0).toUpperCase();
    const initial2 = a.charAt(0).toUpperCase();
    return (initial1 + initial2) || 'U';
  };

  const getDisplayName = (nombres?: string, apellidos?: string) => {
    if (!nombres && !apellidos) return 'Mi Perfil';
    const firstName = toTitleCase((nombres || '').trim().split(' ')[0] || '');
    const firstLastName = toTitleCase((apellidos || '').trim().split(' ')[0] || '');
    return `${firstName} ${firstLastName}`.trim();
  };

  const handleLogoutClick = () => {
    setIsOpen(false);
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    router.push('/login');
  };

  const getNivelText = (niveles?: number[]) => {
    if (!niveles || niveles.length === 0) return null;
    return niveles
      .map((nivel: number) => {
        if (nivel === 0) return 'Inicial';
        if (nivel === 1) return 'Primaria';
        if (nivel === 2) return 'Secundaria';
        return nivel;
      })
      .join(' y ');
  };

  const initials = getInitials(currentUserData.nombres, currentUserData.apellidos);
  const displayName = getDisplayName(currentUserData.nombres, currentUserData.apellidos);
  const fullName = `${toTitleCase(currentUserData.nombres || '')} ${toTitleCase(currentUserData.apellidos || '')}`.trim();
  const roleName = currentUserData.perfil?.nombre ? toTitleCase(currentUserData.perfil.nombre) : 'Usuario';
  const rawUgelText = currentUserData.region ? regionTexto(`${currentUserData.region}`) : null;
  const ugelText = rawUgelText ? rawUgelText.replace(/^UGEL\s*/i, '') : null;
  const nivelText = getNivelText(currentUserData?.nivelDeInstitucion);
  const userPhoto = (currentUserData as any)?.foto || (currentUserData as any)?.photoURL || (currentUserData as any)?.avatar;

  return (
    <>
      <div className={styles.userMenuContainer} ref={menuRef}>
        <button
          type="button"
          className={`${styles.userButton} ${isOpen ? styles.userButtonOpen : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label="Menú de usuario"
        >
          <div className={styles.avatarCircle}>
            {userPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userPhoto} alt="Avatar" className={styles.avatarImg} />
            ) : (
              initials
            )}
          </div>

          <div className={styles.userInfoText}>
            <span className={styles.userName} title={fullName}>
              {displayName}
            </span>
            <span className={styles.userRole}>
              {roleName}
            </span>
          </div>

          <div className={`${styles.arrowCircle} ${isOpen ? styles.arrowCircleOpen : ''}`}>
            <FiChevronDown className={`${styles.arrowIcon} ${isOpen ? styles.arrowRotate : ''}`} />
          </div>
        </button>

        {isOpen && (
          <div className={styles.dropdownCard}>
            {/* Header info */}
            <div className={styles.cardHeader}>
              <div className={styles.headerAvatar}>
                {userPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userPhoto} alt="Avatar" className={styles.avatarImg} />
                ) : (
                  initials
                )}
              </div>
              <div className={styles.headerInfo}>
                <div className={styles.headerFullName} title={fullName}>
                  {fullName || 'Mi Cuenta'}
                </div>
                <div className={styles.headerMeta}>
                  <span className={styles.headerRoleBadge}>
                    {roleName}
                  </span>
                  {currentUserData.dni && (
                    <span className={styles.dniBadge}>
                      DNI: {currentUserData.dni}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Context (Institución, Nivel, UGEL) */}
            {(currentUserData.institucion || nivelText || ugelText) && (
              <div className={styles.contextContainer}>
                <div className={styles.contextBox}>
                  {currentUserData.institucion && (
                    <div className={styles.contextItem}>
                      <div className={styles.contextIconWrap}>
                        <MdSchool className={styles.contextIcon} />
                      </div>
                      <div className={styles.contextText}>
                        <span className={styles.contextLabel}>Institución</span>
                        <span className={styles.contextValue} title={currentUserData.institucion}>
                          {currentUserData.institucion}
                        </span>
                      </div>
                    </div>
                  )}

                  {nivelText && (
                    <div className={styles.contextItem}>
                      <div className={styles.contextIconWrap}>
                        <MdLayers className={styles.contextIconNivel} />
                      </div>
                      <div className={styles.contextText}>
                        <span className={styles.contextLabel}>Nivel</span>
                        <span className={styles.contextValue}>{nivelText}</span>
                      </div>
                    </div>
                  )}

                  {ugelText && (
                    <div className={styles.contextItem}>
                      <div className={styles.contextIconWrap}>
                        <MdOutlineLocationOn className={styles.contextIconLocation} />
                      </div>
                      <div className={styles.contextText}>
                        <span className={styles.contextLabel}>UGEL</span>
                        <span className={styles.contextValue}>UGEL {ugelText}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className={styles.cardDivider} />

            {/* Actions */}
            <div className={styles.cardActions}>
              <Link
                href="/mi-cuenta"
                className={styles.actionLink}
                onClick={() => setIsOpen(false)}
              >
                <div className={styles.actionLinkLeft}>
                  <MdAccountCircle className={styles.actionLinkIcon} />
                  <span>Mi cuenta</span>
                </div>
                <FiChevronRight className={styles.actionArrow} />
              </Link>

              <button
                type="button"
                className={styles.logoutButton}
                onClick={handleLogoutClick}
              >
                <div className={styles.actionLinkLeft}>
                  <FiLogOut className={styles.logoutIcon} />
                  <span>Cerrar sesión</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {showLogoutModal && (
        <ModalConfirmarLogout
          onClose={() => setShowLogoutModal(false)}
          onConfirm={handleConfirmLogout}
        />
      )}
    </>
  );
};

export default NavbarUserMenu;
