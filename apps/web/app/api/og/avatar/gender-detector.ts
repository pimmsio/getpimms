// Liste de prénoms masculins et féminins pour détecter le genre
const MALE_NAMES = new Set([
  // Prénoms français masculins
  'alexandre', 'antoine', 'arthur', 'benjamin', 'charles', 'clement', 'damien', 'david', 'etienne', 'fabien',
  'florian', 'francois', 'gabriel', 'guillaume', 'henri', 'hugo', 'jacques', 'jean', 'jerome', 'julien',
  'kevin', 'laurent', 'louis', 'luc', 'marc', 'martin', 'mathieu', 'maxime', 'michel', 'nicolas',
  'olivier', 'pascal', 'patrick', 'paul', 'philippe', 'pierre', 'raphael', 'remi', 'romain', 'sebastien',
  'stephane', 'thomas', 'vincent', 'xavier', 'yann', 'yves',
  
  // Prénoms anglais masculins
  'aaron', 'adam', 'adrian', 'alan', 'albert', 'alex', 'andrew', 'anthony', 'austin', 'benjamin',
  'brandon', 'brian', 'bruce', 'caleb', 'carlos', 'charles', 'christian', 'christopher', 'daniel', 'david',
  'diego', 'dominic', 'edward', 'eric', 'ethan', 'frank', 'gabriel', 'george', 'henry', 'isaac',
  'jack', 'jacob', 'james', 'jason', 'jeffrey', 'jeremy', 'jesse', 'john', 'jonathan', 'jordan',
  'jose', 'joseph', 'joshua', 'juan', 'justin', 'keith', 'kenneth', 'kevin', 'kyle', 'lawrence',
  'logan', 'luis', 'luke', 'marcus', 'mark', 'matthew', 'michael', 'nathan', 'nicholas', 'noah',
  'oscar', 'patrick', 'paul', 'peter', 'philip', 'richard', 'robert', 'roger', 'ronald', 'ryan',
  'samuel', 'scott', 'sean', 'stephen', 'steven', 'thomas', 'timothy', 'tyler', 'victor', 'walter',
  'william', 'zachary',
  
  // Prénoms internationaux masculins
  'ahmed', 'ali', 'amir', 'antonio', 'carlos', 'diego', 'fernando', 'giovanni', 'hassan', 'ivan',
  'jose', 'juan', 'luigi', 'manuel', 'mario', 'miguel', 'mohamed', 'omar', 'pablo', 'pedro',
  'ricardo', 'roberto', 'sergio', 'vladimir'
]);

const FEMALE_NAMES = new Set([
  // Prénoms français féminins
  'alexandra', 'amelie', 'anne', 'aurelie', 'brigitte', 'camille', 'caroline', 'catherine', 'cecile', 'celine',
  'charlotte', 'christine', 'claire', 'delphine', 'diane', 'dominique', 'elise', 'emilie', 'eva', 'florence',
  'francoise', 'gabrielle', 'helene', 'isabelle', 'jeanne', 'julie', 'justine', 'karine', 'laure', 'lea',
  'louise', 'lucie', 'marie', 'marine', 'marion', 'martine', 'melissa', 'michelle', 'monique', 'nadine',
  'nathalie', 'nicole', 'oceane', 'patricia', 'pauline', 'sabine', 'sandrine', 'sophie', 'stephanie', 'sylvie',
  'valerie', 'vanessa', 'veronique', 'virginie', 'viviane',
  
  // Prénoms anglais féminins
  'abigail', 'alexandra', 'alice', 'amanda', 'amber', 'amy', 'andrea', 'angela', 'anna', 'ashley',
  'barbara', 'betty', 'brenda', 'brittany', 'carol', 'carolyn', 'catherine', 'charlotte', 'christina', 'christine',
  'deborah', 'denise', 'diana', 'donna', 'dorothy', 'elizabeth', 'emily', 'emma', 'evelyn', 'frances',
  'gloria', 'grace', 'hannah', 'heather', 'helen', 'jacqueline', 'jane', 'janet', 'janice', 'jean',
  'jennifer', 'jessica', 'joan', 'joyce', 'judith', 'judy', 'julia', 'julie', 'karen', 'katherine',
  'kathleen', 'kathryn', 'kelly', 'kimberly', 'laura', 'lauren', 'linda', 'lisa', 'lori', 'louise',
  'madison', 'margaret', 'maria', 'marie', 'marilyn', 'martha', 'mary', 'megan', 'melissa', 'michelle',
  'nancy', 'nicole', 'olivia', 'pamela', 'patricia', 'rachel', 'rebecca', 'rose', 'ruth', 'samantha',
  'sandra', 'sara', 'sarah', 'sharon', 'stephanie', 'susan', 'teresa', 'theresa', 'virginia', 'wendy',
  
  // Prénoms internationaux féminins
  'aisha', 'alba', 'ana', 'andrea', 'angela', 'anna', 'antonia', 'bianca', 'carmen', 'claudia',
  'cristina', 'elena', 'fatima', 'francesca', 'gabriela', 'giulia', 'isabella', 'laura', 'lucia',
  'maria', 'marina', 'monica', 'natalia', 'paola', 'patricia', 'rosa', 'sandra', 'silvia', 'sofia',
  'valentina', 'veronica', 'victoria'
]);

export function detectGender(name: string): 'male' | 'female' {
  if (!name || typeof name !== 'string') {
    // Par défaut, retourner male
    return 'male';
  }
  
  // Nettoyer le nom : enlever les espaces, mettre en minuscules
  const cleanName = name.trim().toLowerCase();
  
  // Extraire le prénom (premier mot)
  const firstName = cleanName.split(/\s+/)[0];
  
  // Vérifier d'abord les noms féminins (plus spécifiques)
  if (FEMALE_NAMES.has(firstName)) {
    return 'female';
  }
  
  // Puis vérifier les noms masculins
  if (MALE_NAMES.has(firstName)) {
    return 'male';
  }
  
  // Heuristiques basées sur les terminaisons françaises
  if (firstName.endsWith('e') && !firstName.endsWith('re') && !firstName.endsWith('le')) {
    // La plupart des prénoms féminins français se terminent par 'e'
    // mais pas ceux qui se terminent par 're' ou 'le' (comme Pierre, Alexandre)
    return 'female';
  }
  
  if (firstName.endsWith('a') || firstName.endsWith('ia') || firstName.endsWith('ine') || firstName.endsWith('elle')) {
    return 'female';
  }
  
  // Par défaut, considérer comme masculin
  return 'male';
}
