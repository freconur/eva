import React, { useMemo } from 'react';
import { useRouter } from 'next/router';
import { IoIosArrowForward } from 'react-icons/io';
import { AiOutlineHome } from 'react-icons/ai';
import styles from './navbar.module.css';

const Breadcrumbs = () => {
    const router = useRouter();

    const breadcrumbs = useMemo(() => {
        // Remove query parameters
        const pathWithoutQuery = router.asPath.split('?')[0];

        // Split path into segments
        const pathSegments = pathWithoutQuery.split('/').filter(v => v.length > 0);

        // Build the breadcrumb array
        const crumbList = pathSegments.map((segment, index) => {
            const href = '/' + pathSegments.slice(0, index + 1).join('/');

            // Clean up segment for display (capitalize, replace dashes with spaces)
            let title = segment.replace(/-/g, ' ');
            // Handle ID segments (numbers or long hashes) by generic names or truncating
            if (title.length > 20 || /^\d+$/.test(title) || /^[0-9a-fA-F]{24}$/.test(title) || title === '[id]') {
                title = 'Detalles';
            } else {
                // Capitalize first letter of each word
                title = title.replace(/\b\w/g, char => char.toUpperCase());
            }

            return { href, title };
        });

        return crumbList;
    }, [router.asPath]);

    if (breadcrumbs.length === 0) return null;

    return (
        <nav aria-label="Breadcrumb" className={styles.breadcrumbNav}>
            <ol className={styles.breadcrumbList}>
                <li className={styles.breadcrumbItem}>
                    <span className={styles.breadcrumbLink}>
                        <AiOutlineHome className={styles.homeIcon} />
                    </span>
                </li>

                {breadcrumbs.map((crumb, index) => {
                    const isLast = index === breadcrumbs.length - 1;

                    return (
                        <React.Fragment key={crumb.href}>
                            <li className={styles.breadcrumbSeparator}>
                                <IoIosArrowForward />
                            </li>
                            <li className={`${styles.breadcrumbItem} ${isLast ? styles.active : ''}`}>
                                {isLast ? (
                                    <span className={styles.breadcrumbCurrent} aria-current="page">
                                        {crumb.title}
                                    </span>
                                ) : (
                                    <span className={styles.breadcrumbLinkText}>
                                        {crumb.title}
                                    </span>
                                )}
                            </li>
                        </React.Fragment>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;
