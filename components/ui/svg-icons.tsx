import React from "react";
import Svg, { Path } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

export const HomeOutlineIcon: React.FC<IconProps> = ({
  size = 24,
  color = "#000000",
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 10.5L12.8825 2.82207C12.6355 2.61407 12.3229 2.5 12 2.5C11.6771 2.5 11.3645 2.61407 11.1175 2.82207L2 10.5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M20.5 5V19.5C20.5 20.6046 19.6046 21.5 18.5 21.5H5.5C4.39543 21.5 3.5 20.6046 3.5 19.5V9.5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15 21.5V14.5C15 13.9477 14.5523 13.5 14 13.5H10C9.44772 13.5 9 13.9477 9 14.5L9 21.5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const HomeFilledIcon: React.FC<IconProps> = ({
  size = 24,
  color = "#000000",
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 1.75C12.5459 1.75 13.0746 1.94269 13.4922 2.29395L19.3301 7.2041V5.16699C19.3301 4.62796 19.767 4.19059 20.3066 4.19043C20.8464 4.19043 21.2842 4.62786 21.2842 5.16699V8.84863L22.4023 9.78906L22.4756 9.85742C22.8201 10.2127 22.8463 10.7785 22.5205 11.165C22.2103 11.5326 21.6866 11.613 21.2842 11.3799V19.3213C21.2842 20.9386 19.9716 22.2499 18.3525 22.25H5.64744C4.02833 22.2499 2.7158 20.9386 2.7158 19.3213V11.3799C2.31333 11.613 1.78964 11.5326 1.47947 11.165C1.13202 10.7528 1.18516 10.1364 1.59764 9.78906L10.5088 2.29395L10.6699 2.16992C11.0582 1.89775 11.5223 1.75001 12 1.75ZM9.99998 13.5C9.4477 13.5 8.99998 13.9477 8.99998 14.5V20.25H15V14.5C15 13.9477 14.5523 13.5 14 13.5H9.99998Z"
      fill={color}
    />
  </Svg>
);

export const SocialOutlineIcon: React.FC<IconProps> = ({
  size = 24,
  color = "#000000",
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15 11C17.2091 11 19 9.20914 19 7C19 4.79086 17.2091 3 15 3"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 19C16 16.2386 13.7614 14 11 14H7C4.23858 14 2 16.2386 2 19V21H16V19Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19 21H22V19C22 16.2386 19.7614 14 17 14"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const SocialFilledIcon: React.FC<IconProps> = ({
  size = 24,
  color = "#000000",
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4.25 7C4.25 4.37665 6.37665 2.25 9 2.25C11.6234 2.25 13.75 4.37665 13.75 7C13.75 9.62335 11.6234 11.75 9 11.75C6.37665 11.75 4.25 9.62335 4.25 7Z"
      fill={color}
    />
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M1.25 19C1.25 15.8244 3.82436 13.25 7 13.25H11C14.1756 13.25 16.75 15.8244 16.75 19V21C16.75 21.4142 16.4142 21.75 16 21.75H2C1.58579 21.75 1.25 21.4142 1.25 21V19Z"
      fill={color}
    />
    <Path
      d="M13.375 11.4644C13.8822 11.6492 14.4299 11.75 15.001 11.75C17.6244 11.75 19.751 9.62335 19.751 7C19.751 4.37665 17.6244 2.25 15.001 2.25C14.4299 2.25 13.8822 2.35081 13.375 2.5356C14.5327 3.67 15.251 5.25111 15.251 7C15.251 8.74889 14.5327 10.33 13.375 11.4644Z"
      fill={color}
    />
    <Path
      d="M18.1196 21.75H21.9976C22.4118 21.75 22.7476 21.4142 22.7476 21V19C22.7476 15.8244 20.1732 13.25 16.9976 13.25H15.4141C17.1371 14.5754 18.2476 16.658 18.2476 19V21C18.2476 21.263 18.2025 21.5154 18.1196 21.75Z"
      fill={color}
    />
  </Svg>
);

export const LibraryOutlineIcon: React.FC<IconProps> = ({
  size = 24,
  color = "#000000",
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5.62195 20.1012L3.0462 11.8004C2.84628 11.1561 3.32023 10.5001 3.98567 10.5001H20.0143C20.6798 10.5001 21.1537 11.1561 20.9538 11.8004L18.3781 20.1012C18.1197 20.9338 17.3591 21.5001 16.4991 21.5001H7.50089C6.64091 21.5001 5.88032 20.9338 5.62195 20.1012Z"
      stroke={color}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <Path
      d="M5 8V7.5C5 6.94772 5.44772 6.5 6 6.5H18C18.5523 6.5 19 6.94772 19 7.5V8"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7.5 4V3.5C7.5 2.94772 7.94772 2.5 8.5 2.5H15.5C16.0523 2.5 16.5 2.94772 16.5 3.5V4"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const LibraryFilledIcon: React.FC<IconProps> = ({
  size = 24,
  color = "#000000",
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2.32988 12.0227C1.98484 10.9107 2.79929 9.75012 3.98566 9.75012H20.0143C21.2007 9.75012 22.0151 10.9107 21.6701 12.0227L19.0943 20.3235C18.7405 21.4639 17.6939 22.2501 16.4991 22.2501H7.50088C6.30608 22.2501 5.25953 21.4639 4.90563 20.3235L2.32988 12.0227Z"
      fill={color}
    />
    <Path
      d="M6 5.75C5.0335 5.75 4.25 6.5335 4.25 7.5V8.5H19.75V7.5C19.75 6.5335 18.9665 5.75 18 5.75H6Z"
      fill={color}
    />
    <Path
      d="M8.5 1.75C7.5335 1.75 6.75 2.5335 6.75 3.5V4.5H17.25V3.5C17.25 2.5335 16.4665 1.75 15.5 1.75H8.5Z"
      fill={color}
    />
  </Svg>
);

export const ProfileOutlineIcon: React.FC<IconProps> = ({
  size = 24,
  color = "#000000",
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 9C15 7.34315 13.6569 6 12 6C10.3431 6 9 7.34315 9 9C9 10.6569 10.3431 12 12 12C13.6569 12 15 10.6569 15 9Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M17 17C17 14.2386 14.7614 12 12 12C9.23858 12 7 14.2386 7 17"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ProfileFilledIcon: React.FC<IconProps> = ({
  size = 24,
  color = "#000000",
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 1.25C6.06294 1.25 1.25 6.06294 1.25 12C1.25 17.9371 6.06294 22.75 12 22.75C17.9371 22.75 22.75 17.9371 22.75 12C22.75 6.06294 17.9371 1.25 12 1.25ZM8.75 8.5C8.75 6.70507 10.2051 5.25 12 5.25C13.7949 5.25 15.25 6.70507 15.25 8.5C15.25 9.78708 14.5018 10.8994 13.4167 11.4258C15.8715 12.0477 17.6976 14.2482 17.7498 16.8841C17.7538 17.0855 17.6767 17.28 17.5357 17.4239C16.1299 18.8585 14.1684 19.75 12 19.75C9.83216 19.75 7.87109 18.8589 6.4654 17.425C6.32439 17.2812 6.24717 17.0867 6.25112 16.8853C6.30285 14.249 8.12834 12.0478 10.5833 11.4258C9.49818 10.8994 8.75 9.78708 8.75 8.5Z"
      fill={color}
    />
  </Svg>
);

export const ProfileButtonIcon: React.FC<IconProps> = ({
  size = 24,
  color = "#000000",
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17 8.5C17 5.73858 14.7614 3.5 12 3.5C9.23858 3.5 7 5.73858 7 8.5C7 11.2614 9.23858 13.5 12 13.5C14.7614 13.5 17 11.2614 17 8.5Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19 20.5C19 16.634 15.866 13.5 12 13.5C8.13401 13.5 5 16.634 5 20.5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ShareIcon: React.FC<IconProps> = ({
  size = 24,
  color = "#000000",
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 6.5C21 8.15685 19.6569 9.5 18 9.5C16.3431 9.5 15 8.15685 15 6.5C15 4.84315 16.3431 3.5 18 3.5C19.6569 3.5 21 4.84315 21 6.5Z"
      stroke={color}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <Path
      d="M9 12C9 13.6569 7.65685 15 6 15C4.34315 15 3 13.6569 3 12C3 10.3431 4.34315 9 6 9C7.65685 9 9 10.3431 9 12Z"
      stroke={color}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <Path
      d="M21 17.5C21 19.1569 19.6569 20.5 18 20.5C16.3431 20.5 15 19.1569 15 17.5C15 15.8431 16.3431 14.5 18 14.5C19.6569 14.5 21 15.8431 21 17.5Z"
      stroke={color}
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <Path
      d="M8.5 10.4995L15 7.5M8.5 13L15 15.9995"
      stroke={color}
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </Svg>
);

export const DeleteIcon: React.FC<IconProps> = ({
  size = 24,
  color = "#000000",
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19.5 5.5L18.6139 20.121C18.5499 21.1766 17.6751 22 16.6175 22H7.38246C6.32488 22 5.4501 21.1766 5.38612 20.121L4.5 5.5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3 5.5H8M21 5.5H16M16 5.5L14.7597 2.60608C14.6022 2.2384 14.2406 2 13.8406 2H10.1594C9.75937 2 9.39783 2.2384 9.24025 2.60608L8 5.5M16 5.5H8"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9.5 16.5L9.5 10.5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14.5 16.5L14.5 10.5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const BookmarkIcon: React.FC<IconProps> = ({
  size = 24,
  color = "#000000",
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 21.5V6.5C4 5.94772 4.44772 5.5 5 5.5H16C16.5523 5.5 17 5.94772 17 6.5V21.5L10.5 17.5L4 21.5Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 2.5H18C19.1046 2.5 20 3.39543 20 4.5V18.5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const StarIcon: React.FC<IconProps> = ({
  size = 24,
  color = "#000000",
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11.109 3.74829C11.48 3.02037 12.52 3.02037 12.891 3.74829L15.0785 8.0407C15.2237 8.32561 15.4964 8.5239 15.8122 8.5742L20.5671 9.33147C21.373 9.45983 21.6941 10.4474 21.1178 11.0252L17.7138 14.4383C17.4883 14.6644 17.3844 14.9846 17.4341 15.3001L18.1843 20.0635C18.3114 20.8702 17.4703 21.4808 16.7426 21.1102L12.4539 18.9254C12.1687 18.7801 11.8313 18.7801 11.5461 18.9254L7.25739 21.1102C6.52973 21.4808 5.68859 20.8702 5.81565 20.0635L6.56594 15.3001C6.61562 14.9846 6.51167 14.6644 6.28617 14.4383L2.88217 11.0252C2.3059 10.4474 2.62703 9.45983 3.43294 9.33147L8.18782 8.5742C8.50362 8.5239 8.77632 8.32561 8.92151 8.0407L11.109 3.74829Z"
      stroke={color}
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </Svg>
);

export const EditIcon: React.FC<IconProps> = ({
  size = 24,
  color = "#000000",
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3.93838 15.6234L3.00008 21L8.37699 20.0615C8.78249 19.9908 9.15627 19.7966 9.44733 19.5055L20.5607 8.392C21.1465 7.80621 21.1465 6.85644 20.5606 6.27066L17.7292 3.43932C17.1434 2.85355 16.1937 2.85356 15.6079 3.43934L4.49439 14.5531C4.20332 14.8441 4.00915 15.2179 4.00915 15.6234L3.93838 15.6234Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 6L18 10"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
