const colors = [
    '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#34495e', 
    '#f1c40f', '#e67e22', '#e74c3c', '#95a5a6', '#16a085'
];

const getInitials = (name: string) => {
    if (!name) return '?';
    const words = name.split(' ');
    if (words.length > 1) {
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const getRandomColor = (name: string) => {
    if (!name) return colors[0];
    const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[charCodeSum % colors.length];
};

export const getAvatarPlaceholder = (name: string) => {
    const initials = getInitials(name);
    const color = getRandomColor(name);
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
            <rect width="100%" height="100%" fill="${color}" />
            <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="60" fill="#ffffff">
                ${initials}
            </text>
        </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export const getBannerPlaceholder = (name: string) => {
    const color = getRandomColor(name);
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="300" viewBox="0 0 1200 300">
            <rect width="100%" height="100%" fill="${color}" />
            <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="100" fill="#ffffff">
                ${name}
            </text>
        </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
};
