
let images = [
  {width: 1001, height: 381, src: 'https://i.imgur.com/Z7AzH2c.jpg'},
  {width: 640, height: 640, src: 'https://i.imgur.com/DhygPot.jpg'},
  {width: 182, height: 1009, src: 'https://i.imgur.com/L7RTlvI.png'},
  {width: 1516, height: 1009, src: 'https://i.imgur.com/1nScMIH.jpg'},
  {width: 1215, height: 121, src: 'https://i.imgur.com/zzwWogn.jpg'}
];

// descriptions separate from images so that the same image might have multiple different descriptions
let descriptions = [
  'Description',
  'Description that is a medium length',
  'This is the description that never ends, it goes on and on my friends. Someone started typing without knowing what it was',
  'Rechtsschutzversicherungsgesellschaften Nahrungsmittelunverträglichkeit Unabhängigkeitserklärungen Freundschaftsbeziehungen'
];

export function getImage(index: number) {
  return images[index % images.length].src;
}

export function getImageFullData(index: number) {
  return images[index % images.length];
}

export function getDescription(index: number) {
  return descriptions[index % descriptions.length];
}
