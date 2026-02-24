import * as yup from 'yup';

export const tagValidationSchema = yup.object().shape({
  name: yup
    .string()
    .required('Tag name is required')
    .min(2, 'Tag name must be at least 2 characters')
    .max(50, 'Tag name must be at most 50 characters')
    .matches(
      /^[a-zA-Z0-9\s-_]+$/,
      'Tag name can only contain letters, numbers, spaces, hyphens and underscores'
    ),
  type: yup
    .string()
    .required('Tag type is required')
    .oneOf(['general', 'quote', 'user', 'dealership', 'support', 'custom'], 'Invalid tag type'),
  colour: yup
    .string()
    .required('Color is required')
    .matches(/^#([0-9a-fA-F]{3}){1,2}$/, 'Invalid color format'),
});
