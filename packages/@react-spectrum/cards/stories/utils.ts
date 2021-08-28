
let images = [
  'https://i.imgur.com/Z7AzH2c.jpg',
  'https://i.imgur.com/DhygPot.jpg',
  'https://i.imgur.com/L7RTlvI.png',
  'https://i.imgur.com/1nScMIH.jpg',
  'https://i.imgur.com/zzwWogn.jpg'
];

// descriptions separate from images so that the same image might have multiple different descriptions
let descriptions = [
  'Description',
  'Description that is a medium length',
  'This is the description that never ends, it goes on and on my friends. Someone started typing without knowing what it was',
  'Rechtsschutzversicherungsgesellschaften Nahrungsmittelunverträglichkeit Unabhängigkeitserklärungen Freundschaftsbeziehungen'
];

export function getImage(index: number) {
  return images[index % images.length];
}

export function getDescription(index: number) {
  return descriptions[index % descriptions.length];
}
