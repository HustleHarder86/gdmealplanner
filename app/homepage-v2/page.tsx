'use client';

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Check, Shield, ChevronDown } from "lucide-react";
import { useRecipes } from "@/src/hooks/useRecipes";

export default function ExactWordPressHomepage() {
  const [showFreeModal, setShowFreeModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  // Use recipe hooks for dynamic content
  const { recipes, loading: recipesLoading } = useRecipes();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thank you! Your free meal planner will be sent shortly.');
    setShowFreeModal(false);
  };

  return (
    <div className="min-h-screen bg-white font-[var(--font-poppins)]">
      {/* Header/Navigation */}
      <header className="bg-white shadow-sm py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Image 
              src="https://pregnancyplateplanner.com/wp-content/uploads/2023/06/Green-and-Black-Simple-Clean-Vegan-Food-Logo.png" 
              alt="Pregnancy Plate Planner Logo of Spoon and Fork"
              width={60}
              height={60}
              className="mr-3"
            />
            <span className="text-xl font-bold text-[rgb(57,67,63)]">Pregnancy Plate Planner</span>
          </div>
          <nav className="hidden md:flex space-x-6 text-[rgb(57,67,63)]">
            <Link href="#" className="hover:text-[rgb(34,119,85)]">Home</Link>
            <Link href="#" className="hover:text-[rgb(34,119,85)]">Meal Planner</Link>
            <Link href="#" className="hover:text-[rgb(34,119,85)]">Recipes</Link>
            <Link href="#" className="hover:text-[rgb(34,119,85)]">Suggest Me</Link>
            <Link href="#" className="hover:text-[rgb(34,119,85)]">Blog</Link>
            <Link href="#" className="hover:text-[rgb(34,119,85)]">About Us</Link>
            <Link href="#" className="hover:text-[rgb(34,119,85)]">Contact Us</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 font-[var(--font-domine)] text-[rgb(57,67,63)]">
            Control Your{" "}
            <span className="text-[rgb(237,166,2)]">Gestational Diabetes</span>
            <br />
            with Our Tailored Meal Plans!
          </h1>
          
          <p className="text-xl mb-12 max-w-4xl mx-auto text-[rgba(57,67,63,0.8)]">
            Get personalized meal plans designed by registered dietitians specifically for managing 
            gestational diabetes. Take control of your nutrition and your baby&apos;s health.
          </p>
          
          <button 
            onClick={() => setShowFreeModal(true)}
            className="bg-[rgb(237,166,2)] hover:bg-[rgb(220,150,0)] text-black font-bold py-3 px-8 rounded text-2xl shadow-lg transform transition hover:scale-105 font-[var(--font-bitter)]"
          >
            Get my Free Meal Planner
          </button>
          
          <div className="mt-8 flex items-center justify-center space-x-8 text-lg text-[rgb(57,67,63)]">
            <div className="flex items-center">
              <Check className="w-6 h-6 mr-2 text-[rgb(237,166,2)]" />
              <span>Instant Download</span>
            </div>
            <div className="flex items-center">
              <Check className="w-6 h-6 mr-2 text-[rgb(237,166,2)]" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center">
              <Check className="w-6 h-6 mr-2 text-[rgb(237,166,2)]" />
              <span>Created by RDs</span>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[rgb(57,67,63)] mb-8 font-[var(--font-domine)]">
              Congratulations on Your Pregnancy!
            </h2>
            <p className="text-xl text-[rgba(57,67,63,0.7)] max-w-4xl mx-auto leading-relaxed">
              Managing gestational diabetes doesn&apos;t have to be overwhelming. Our comprehensive meal planning system 
              is designed specifically for expecting mothers to help you maintain healthy blood sugar levels while 
              ensuring you and your baby get the nutrition you need. Stay healthy, stay confident, and enjoy your 
              pregnancy journey with expert guidance every step of the way.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            <div className="bg-[rgb(7,18,13,0.06)] rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-[rgb(34,119,85)] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🍽️</span>
              </div>
              <h3 className="text-xl font-bold text-[rgb(57,67,63)] mb-4 font-[var(--font-bitter)]">
                Expert Meal Plans
              </h3>
              <p className="text-[rgba(57,67,63,0.7)] leading-relaxed">
                Scientifically designed meal plans created by registered dietitians specializing in gestational diabetes management.
              </p>
            </div>
            
            <div className="bg-[rgb(7,18,13,0.06)] rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-[rgb(237,166,2)] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-xl font-bold text-[rgb(57,67,63)] mb-4 font-[var(--font-bitter)]">
                Smart Shopping Lists
              </h3>
              <p className="text-[rgba(57,67,63,0.7)] leading-relaxed">
                Automatically generated grocery lists organized by store section to make shopping efficient and stress-free.
              </p>
            </div>
            
            <div className="bg-[rgb(7,18,13,0.06)] rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-[rgb(34,119,85)] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">💡</span>
              </div>
              <h3 className="text-xl font-bold text-[rgb(57,67,63)] mb-4 font-[var(--font-bitter)]">
                Educational Support
              </h3>
              <p className="text-[rgba(57,67,63,0.7)] leading-relaxed">
                Access to comprehensive resources and guidance to help you understand and manage your gestational diabetes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Customizable Meal Plans Section */}
      <section className="py-20 bg-[rgb(7,18,13,0.06)]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-[rgb(57,67,63)] mb-8 font-[var(--font-domine)]">
                Customizable Meal Plans
              </h2>
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="bg-[rgb(34,119,85)] p-3 rounded-full min-w-[3rem]">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-[rgb(57,67,63)] mb-3 font-[var(--font-bitter)]">
                      Personalization
                    </h4>
                    <p className="text-lg text-[rgba(57,67,63,0.7)] leading-relaxed">
                      Every meal plan is tailored to your specific gestational diabetes needs, 
                      dietary preferences, and pregnancy stage for optimal results.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-[rgb(34,119,85)] p-3 rounded-full min-w-[3rem]">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-[rgb(57,67,63)] mb-3 font-[var(--font-bitter)]">
                      Flexibility
                    </h4>
                    <p className="text-lg text-[rgba(57,67,63,0.7)] leading-relaxed">
                      Easily swap meals, adjust portions, and modify recipes to match your 
                      taste preferences and busy lifestyle.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-[rgb(34,119,85)] p-3 rounded-full min-w-[3rem]">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-[rgb(57,67,63)] mb-3 font-[var(--font-bitter)]">
                      Convenience
                    </h4>
                    <p className="text-lg text-[rgba(57,67,63,0.7)] leading-relaxed">
                      Save hours of meal planning with ready-made weekly menus that take 
                      the guesswork out of healthy eating during pregnancy.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-[rgb(34,119,85)] p-3 rounded-full min-w-[3rem]">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-[rgb(57,67,63)] mb-3 font-[var(--font-bitter)]">
                      Peace of Mind
                    </h4>
                    <p className="text-lg text-[rgba(57,67,63,0.7)] leading-relaxed">
                      Know that every meal supports healthy blood sugar levels and optimal 
                      nutrition for both you and your growing baby.
                    </p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setShowFreeModal(true)}
                className="mt-10 bg-[rgb(237,166,2)] hover:bg-[rgb(220,150,0)] text-black font-bold py-3 px-6 rounded text-xl shadow-lg transition transform hover:scale-105 font-[var(--font-bitter)]"
              >
                Get my Customizable Free Meal Planner
              </button>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <Image
                src="https://pregnancyplateplanner.com/wp-content/uploads/2023/12/c24e9659-c33e-4bfd-aeea-7aef68d6ed1c.jpg"
                alt="Healthy meal plan example"
                width={500}
                height={400}
                className="w-full h-80 object-cover rounded-xl mb-6"
              />
              <p className="text-center text-[rgb(57,67,63)] text-lg">
                Sample meal plan preview showing balanced, GD-friendly meals
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Personalized Grocery Lists Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="bg-[rgb(7,18,13,0.06)] rounded-2xl shadow-lg p-8">
              <Image
                src="https://pregnancyplateplanner.com/wp-content/uploads/2023/12/7b699a33-6851-4ccc-9930-a40fab00cc7c.jpg"
                alt="Organized grocery shopping"
                width={500}
                height={400}
                className="w-full h-80 object-cover rounded-xl mb-6"
              />
              <p className="text-center text-[rgb(57,67,63)] text-lg">
                Organized shopping lists make grocery trips quick and efficient
              </p>
            </div>
            
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-[rgb(57,67,63)] mb-8 font-[var(--font-domine)]">
                Personalized Grocery Lists
              </h2>
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="bg-[rgb(237,166,2)] p-3 rounded-full min-w-[3rem]">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-[rgb(57,67,63)] mb-3 font-[var(--font-bitter)]">
                      Customized Shopping
                    </h4>
                    <p className="text-lg text-[rgba(57,67,63,0.7)] leading-relaxed">
                      Get shopping lists automatically generated from your personalized 
                      meal plans - no more wondering what to buy at the store.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-[rgb(237,166,2)] p-3 rounded-full min-w-[3rem]">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-[rgb(57,67,63)] mb-3 font-[var(--font-bitter)]">
                      Streamlined Experience
                    </h4>
                    <p className="text-lg text-[rgba(57,67,63,0.7)] leading-relaxed">
                      Lists organized by store section (produce, dairy, pantry) to make 
                      your shopping trip as efficient and stress-free as possible.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="bg-[rgb(237,166,2)] p-3 rounded-full min-w-[3rem]">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-[rgb(57,67,63)] mb-3 font-[var(--font-bitter)]">
                      Healthy Selections
                    </h4>
                    <p className="text-lg text-[rgba(57,67,63,0.7)] leading-relaxed">
                      Every item is carefully chosen to support your gestational diabetes management 
                      with the perfect balance of nutrients and flavors.
                    </p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setShowFreeModal(true)}
                className="mt-10 bg-[rgb(237,166,2)] hover:bg-[rgb(220,150,0)] text-black font-bold py-3 px-6 rounded text-xl shadow-lg transition transform hover:scale-105 font-[var(--font-bitter)]"
              >
                Get my Personalized Grocery List
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Expert-Designed Meal Plans Section */}
      <section className="py-20 bg-[rgb(7,18,13,0.06)]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[rgb(57,67,63)] mb-6 font-[var(--font-domine)]">
              Expert-Designed Meal Plans
            </h2>
            <p className="text-xl text-[rgba(57,67,63,0.7)] max-w-3xl mx-auto">
              Created by registered dietitians who specialize in gestational diabetes and pregnancy nutrition
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
              <div className="w-20 h-20 bg-[rgb(34,119,85)] rounded-full flex items-center justify-center mx-auto mb-8">
                <span className="text-3xl">👩‍⚕️</span>
              </div>
              <h3 className="text-2xl font-bold text-[rgb(57,67,63)] mb-6 font-[var(--font-bitter)]">
                Created by RDs
              </h3>
              <p className="text-lg text-[rgba(57,67,63,0.7)] leading-relaxed">
                Every meal plan is designed by registered dietitians with specialized expertise 
                in pregnancy nutrition and diabetes management for optimal health outcomes.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
              <div className="w-20 h-20 bg-[rgb(237,166,2)] rounded-full flex items-center justify-center mx-auto mb-8">
                <span className="text-3xl">⚖️</span>
              </div>
              <h3 className="text-2xl font-bold text-[rgb(57,67,63)] mb-6 font-[var(--font-bitter)]">
                Nutritionally Optimized
              </h3>
              <p className="text-lg text-[rgba(57,67,63,0.7)] leading-relaxed">
                Perfect balance of macronutrients and essential micronutrients to support 
                both your health and your baby&apos;s healthy development throughout pregnancy.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
              <div className="w-20 h-20 bg-[rgb(34,119,85)] rounded-full flex items-center justify-center mx-auto mb-8">
                <span className="text-3xl">📈</span>
              </div>
              <h3 className="text-2xl font-bold text-[rgb(57,67,63)] mb-6 font-[var(--font-bitter)]">
                Blood Sugar Friendly
              </h3>
              <p className="text-lg text-[rgba(57,67,63,0.7)] leading-relaxed">
                All recipes are specifically chosen and tested to help maintain stable blood 
                sugar levels throughout your pregnancy journey while keeping meals delicious.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-16">
            <button 
              onClick={() => setShowFreeModal(true)}
              className="bg-[rgb(34,119,85)] hover:bg-[rgb(25,90,65)] text-white font-bold py-3 px-8 rounded text-xl shadow-lg transition transform hover:scale-105 font-[var(--font-bitter)]"
            >
              Get my Registered Dietitian Meal Planner
            </button>
          </div>
        </div>
      </section>

      {/* Featured Recipes Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[rgb(57,67,63)] mb-6 font-[var(--font-domine)]">
              Most Viewed Recipes
            </h2>
            <p className="text-xl text-[rgba(57,67,63,0.7)] max-w-3xl mx-auto">
              Delicious, gestational diabetes-friendly recipes loved by thousands of moms
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {recipesLoading ? (
              // Loading skeletons
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-xl overflow-hidden animate-pulse">
                  <div className="w-full h-64 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))
            ) : recipes && recipes.length > 0 ? (
              // Dynamic recipes from hooks
              recipes.slice(0, 4).map((recipe) => (
                <div key={recipe.id} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                  <Image
                    src={recipe.imageUrl || "https://pregnancyplateplanner.com/wp-content/uploads/2023/09/Untitled-Blog-Banner-Instagram-Post-Portrait-Instagram-Post-300x300.png"}
                    alt={recipe.title}
                    width={300}
                    height={300}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[rgb(57,67,63)] mb-3 font-[var(--font-bitter)]">
                      {recipe.title}
                    </h3>
                    <p className="text-[rgba(57,67,63,0.7)]">
                      {recipe.description || `GD-friendly recipe with ${recipe.nutrition?.carbohydrates}g carbs per serving`}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              // Fallback to static WordPress content
              <>
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                  <Image
                    src="https://pregnancyplateplanner.com/wp-content/uploads/2023/09/Untitled-Blog-Banner-Instagram-Post-Portrait-Instagram-Post-300x300.png"
                    alt="Grilled Salmon with Lemon and Dill"
                    width={300}
                    height={300}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[rgb(57,67,63)] mb-3 font-[var(--font-bitter)]">
                      Grilled Salmon with Lemon and Dill
                    </h3>
                    <p className="text-[rgba(57,67,63,0.7)]">
                      Perfect protein-rich meal with omega-3 fatty acids for brain development
                    </p>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                  <Image
                    src="https://pregnancyplateplanner.com/wp-content/uploads/2023/07/Untitled-design-36-300x300.png"
                    alt="Greek Yogurt with Nuts"
                    width={300}
                    height={300}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[rgb(57,67,63)] mb-3 font-[var(--font-bitter)]">
                      Nutty Greek Yogurt Delight
                    </h3>
                    <p className="text-[rgba(57,67,63,0.7)]">
                      High-protein snack with healthy fats and probiotics for digestive health
                    </p>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                  <Image
                    src="https://pregnancyplateplanner.com/wp-content/uploads/2023/07/Untitled-Instagram-Post-Square-300x300.png"
                    alt="Magnesium Breakfast Smoothie"
                    width={300}
                    height={300}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[rgb(57,67,63)] mb-3 font-[var(--font-bitter)]">
                      Magnesium Breakfast Smoothie
                    </h3>
                    <p className="text-[rgba(57,67,63,0.7)]">
                      Nutrient-dense morning blend supporting healthy blood sugar levels
                    </p>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                  <Image
                    src="https://pregnancyplateplanner.com/wp-content/uploads/2023/07/Untitled-design-37-300x300.png"
                    alt="Quinoa Vegetable Bowl"
                    width={300}
                    height={300}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[rgb(57,67,63)] mb-3 font-[var(--font-bitter)]">
                      Quinoa Vegetable Bowl
                    </h3>
                    <p className="text-[rgba(57,67,63,0.7)]">
                      Complete protein with fiber-rich vegetables for stable blood sugar
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="text-center mt-12">
            <button 
              onClick={() => setShowFreeModal(true)}
              className="bg-[rgb(34,119,85)] hover:bg-[rgb(25,90,65)] text-white font-bold py-3 px-6 rounded text-xl shadow-lg transition transform hover:scale-105 font-[var(--font-bitter)]"
            >
              Check Sample Recipes
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-[rgb(7,18,13,0.06)]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[rgb(57,67,63)] mb-6 font-[var(--font-domine)]">
              Choose Your Plan
            </h2>
            <p className="text-xl text-[rgba(57,67,63,0.7)]">
              Affordable nutrition support for your entire pregnancy journey
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-10">
            <div className="bg-white border-2 border-[rgb(233,233,233)] rounded-2xl p-10 shadow-lg">
              <h3 className="text-3xl font-bold text-[rgb(57,67,63)] mb-6 font-[var(--font-bitter)]">
                Monthly Plan
              </h3>
              <div className="mb-8">
                <span className="text-5xl font-bold text-[rgb(57,67,63)]">$49</span>
                <span className="text-xl text-[rgba(57,67,63,0.7)]">.00/month</span>
              </div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center text-lg">
                  <Check className="w-6 h-6 text-[rgb(34,119,85)] mr-4 flex-shrink-0" />
                  <span>Unlimited personalized meal plans</span>
                </li>
                <li className="flex items-center text-lg">
                  <Check className="w-6 h-6 text-[rgb(34,119,85)] mr-4 flex-shrink-0" />
                  <span>Custom grocery lists</span>
                </li>
                <li className="flex items-center text-lg">
                  <Check className="w-6 h-6 text-[rgb(34,119,85)] mr-4 flex-shrink-0" />
                  <span>Recipe modifications</span>
                </li>
                <li className="flex items-center text-lg">
                  <Check className="w-6 h-6 text-[rgb(34,119,85)] mr-4 flex-shrink-0" />
                  <span>Nutritional tracking</span>
                </li>
              </ul>
              <button className="w-full bg-[rgb(57,67,63)] hover:bg-[rgb(40,50,45)] text-white font-bold py-4 rounded text-xl transition">
                Get Started Now
              </button>
            </div>
            
            <div className="bg-[rgb(237,166,2)] rounded-2xl p-10 relative shadow-lg">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-[rgb(34,119,85)] text-white px-6 py-2 rounded-full text-sm font-bold">
                  BEST VALUE
                </span>
              </div>
              <h3 className="text-3xl font-bold text-[rgb(57,67,63)] mb-6 font-[var(--font-bitter)]">
                Yearly Plan
              </h3>
              <div className="mb-8">
                <span className="text-5xl font-bold text-[rgb(57,67,63)]">$99</span>
                <span className="text-xl text-[rgb(57,67,63)]">.00/year</span>
                <div className="text-lg text-[rgb(57,67,63)] font-bold mt-2">Save over $480!</div>
              </div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center text-lg text-[rgb(57,67,63)]">
                  <Check className="w-6 h-6 text-[rgb(34,119,85)] mr-4 flex-shrink-0" />
                  <span>Everything in Monthly Plan</span>
                </li>
                <li className="flex items-center text-lg text-[rgb(57,67,63)]">
                  <Check className="w-6 h-6 text-[rgb(34,119,85)] mr-4 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center text-lg text-[rgb(57,67,63)]">
                  <Check className="w-6 h-6 text-[rgb(34,119,85)] mr-4 flex-shrink-0" />
                  <span>Exclusive recipes</span>
                </li>
                <li className="flex items-center text-lg text-[rgb(57,67,63)]">
                  <Check className="w-6 h-6 text-[rgb(34,119,85)] mr-4 flex-shrink-0" />
                  <span>Postpartum meal plans</span>
                </li>
              </ul>
              <button className="w-full bg-[rgb(57,67,63)] hover:bg-[rgb(40,50,45)] text-white font-bold py-4 rounded text-xl transition">
                Get Started Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[rgb(57,67,63)] mb-6 font-[var(--font-domine)]">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-[rgba(57,67,63,0.7)]">
              Get answers to common questions about our gestational diabetes meal planning service
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-[rgb(7,18,13,0.06)] rounded-xl overflow-hidden">
              <button
                className="w-full px-8 py-6 text-left flex justify-between items-center hover:bg-[rgb(7,18,13,0.1)] transition-colors"
                onClick={() => setOpenFaq(openFaq === 0 ? null : 0)}
              >
                <span className="text-lg font-semibold text-[rgb(57,67,63)]">
                  How are the meal plans customized for gestational diabetes?
                </span>
                <ChevronDown className={`w-5 h-5 text-[rgb(57,67,63)] transition-transform ${openFaq === 0 ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === 0 && (
                <div className="px-8 pb-6">
                  <p className="text-[rgba(57,67,63,0.7)] leading-relaxed">
                    Our registered dietitians create personalized meal plans based on your specific nutritional needs, 
                    pregnancy stage, dietary preferences, and blood sugar management goals. Each plan follows proven 
                    guidelines for gestational diabetes while ensuring you get the nutrients you and your baby need.
                  </p>
                </div>
              )}
            </div>
            
            <div className="bg-[rgb(7,18,13,0.06)] rounded-xl overflow-hidden">
              <button
                className="w-full px-8 py-6 text-left flex justify-between items-center hover:bg-[rgb(7,18,13,0.1)] transition-colors"
                onClick={() => setOpenFaq(openFaq === 1 ? null : 1)}
              >
                <span className="text-lg font-semibold text-[rgb(57,67,63)]">
                  Can I modify the meal plans if I have food allergies or preferences?
                </span>
                <ChevronDown className={`w-5 h-5 text-[rgb(57,67,63)] transition-transform ${openFaq === 1 ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === 1 && (
                <div className="px-8 pb-6">
                  <p className="text-[rgba(57,67,63,0.7)] leading-relaxed">
                    Absolutely! Our meal planning system allows you to specify food allergies, dietary restrictions, 
                    and personal preferences. We can accommodate vegetarian, vegan, gluten-free, dairy-free, and many 
                    other dietary needs while maintaining optimal nutrition for gestational diabetes management.
                  </p>
                </div>
              )}
            </div>
            
            <div className="bg-[rgb(7,18,13,0.06)] rounded-xl overflow-hidden">
              <button
                className="w-full px-8 py-6 text-left flex justify-between items-center hover:bg-[rgb(7,18,13,0.1)] transition-colors"
                onClick={() => setOpenFaq(openFaq === 2 ? null : 2)}
              >
                <span className="text-lg font-semibold text-[rgb(57,67,63)]">
                  How quickly will I see results with the meal plans?
                </span>
                <ChevronDown className={`w-5 h-5 text-[rgb(57,67,63)] transition-transform ${openFaq === 2 ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === 2 && (
                <div className="px-8 pb-6">
                  <p className="text-[rgba(57,67,63,0.7)] leading-relaxed">
                    Many of our users see improvements in their blood sugar levels within the first week of following 
                    our meal plans. However, individual results may vary. We recommend working closely with your healthcare 
                    team to monitor your progress and make any necessary adjustments to your diabetes management plan.
                  </p>
                </div>
              )}
            </div>
            
            <div className="bg-[rgb(7,18,13,0.06)] rounded-xl overflow-hidden">
              <button
                className="w-full px-8 py-6 text-left flex justify-between items-center hover:bg-[rgb(7,18,13,0.1)] transition-colors"
                onClick={() => setOpenFaq(openFaq === 3 ? null : 3)}
              >
                <span className="text-lg font-semibold text-[rgb(57,67,63)]">
                  Can I cancel my subscription at any time?
                </span>
                <ChevronDown className={`w-5 h-5 text-[rgb(57,67,63)] transition-transform ${openFaq === 3 ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === 3 && (
                <div className="px-8 pb-6">
                  <p className="text-[rgba(57,67,63,0.7)] leading-relaxed">
                    Yes, you can cancel your subscription at any time through your account dashboard or by contacting 
                    our support team. There are no cancellation fees, and you&apos;ll continue to have access to your meal 
                    plans until the end of your current billing period. We also offer a 30-day money-back guarantee.
                  </p>
                </div>
              )}
            </div>
            
            <div className="bg-[rgb(7,18,13,0.06)] rounded-xl overflow-hidden">
              <button
                className="w-full px-8 py-6 text-left flex justify-between items-center hover:bg-[rgb(7,18,13,0.1)] transition-colors"
                onClick={() => setOpenFaq(openFaq === 4 ? null : 4)}
              >
                <span className="text-lg font-semibold text-[rgb(57,67,63)]">
                  Do you provide support from registered dietitians?
                </span>
                <ChevronDown className={`w-5 h-5 text-[rgb(57,67,63)] transition-transform ${openFaq === 4 ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === 4 && (
                <div className="px-8 pb-6">
                  <p className="text-[rgba(57,67,63,0.7)] leading-relaxed">
                    Yes! All our meal plans are created by registered dietitians specializing in pregnancy nutrition and 
                    diabetes management. Premium subscribers also get access to one-on-one consultations and personalized 
                    guidance to help optimize their meal plans and manage their gestational diabetes effectively.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Subscription Section */}
      <section className="py-20 bg-[rgb(7,18,13,0.06)]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-[rgb(57,67,63)] mb-6 font-[var(--font-domine)]">
            Stay Updated with Expert Tips
          </h2>
          <p className="text-xl text-[rgba(57,67,63,0.7)] mb-12 max-w-3xl mx-auto">
            Get weekly gestational diabetes management tips, new recipes, and exclusive content 
            delivered straight to your inbox. Join thousands of expecting mothers on their healthy pregnancy journey.
          </p>
          
          <div className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <input 
                type="email" 
                placeholder="Enter your email address"
                className="flex-1 px-6 py-4 rounded text-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[rgb(34,119,85)] focus:border-transparent"
              />
              <button className="bg-[rgb(237,166,2)] hover:bg-[rgb(220,150,0)] text-black font-bold px-8 py-4 rounded text-lg transition transform hover:scale-105 whitespace-nowrap">
                Subscribe Now
              </button>
            </div>
            <p className="text-sm text-[rgba(57,67,63,0.6)] mt-4">
              We respect your privacy. Unsubscribe at any time. No spam, ever.
            </p>
          </div>
          
          <div className="flex items-center justify-center mt-12 space-x-8 text-sm text-[rgba(57,67,63,0.7)]">
            <div className="flex items-center">
              <Check className="w-5 h-5 mr-2 text-[rgb(34,119,85)]" />
              <span>Weekly GD tips</span>
            </div>
            <div className="flex items-center">
              <Check className="w-5 h-5 mr-2 text-[rgb(34,119,85)]" />
              <span>New recipes</span>
            </div>
            <div className="flex items-center">
              <Check className="w-5 h-5 mr-2 text-[rgb(34,119,85)]" />
              <span>Expert advice</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-[rgb(34,119,85)] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 font-[var(--font-domine)]">
            Ready to Take Control of Your Gestational Diabetes?
          </h2>
          <p className="text-xl mb-12 opacity-90 max-w-3xl mx-auto">
            Join thousands of moms who are successfully managing their GD with our expert meal plans. 
            Start your journey to a healthier pregnancy today.
          </p>
          <button 
            onClick={() => setShowFreeModal(true)}
            className="bg-[rgb(237,166,2)] hover:bg-[rgb(220,150,0)] text-black font-bold py-3 px-8 rounded text-2xl shadow-lg transition transform hover:scale-105 mb-8 font-[var(--font-bitter)]"
          >
            Access My Free Meal Planner
          </button>
          
          <div className="flex items-center justify-center text-lg opacity-75">
            <Shield className="w-6 h-6 mr-3" />
            <span>30-day money-back guarantee • Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Free Meal Planner Modal */}
      {showFreeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-8 relative">
            <button
              onClick={() => setShowFreeModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
            
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-[rgb(57,67,63)] mb-4 font-[var(--font-domine)]">
                Get Your Free Meal Planner
              </h3>
              <p className="text-lg text-[rgba(57,67,63,0.7)]">
                Designed specifically for gestational diabetes management
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[rgb(57,67,63)] mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[rgb(34,119,85)] text-lg"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[rgb(57,67,63)] mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[rgb(34,119,85)] text-lg"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[rgb(57,67,63)] mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[rgb(34,119,85)] text-lg"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[rgb(237,166,2)] hover:bg-[rgb(220,150,0)] text-black font-bold py-4 rounded text-xl transition font-[var(--font-bitter)]"
              >
                Send My Free Meal Planner
              </button>
              
              <p className="text-sm text-[rgba(57,67,63,0.7)] text-center">
                We&apos;ll email you a complete 3-day meal plan sample. No spam, ever.
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Recent Recipes Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[rgb(57,67,63)] mb-6 font-[var(--font-domine)]">
              Recent Recipes
            </h2>
            <p className="text-xl text-[rgba(57,67,63,0.7)]">
              Fresh recipe ideas to keep your meal planning exciting and nutritious
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <article className="bg-[rgb(7,18,13,0.06)] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <Image
                src="https://pregnancyplateplanner.com/wp-content/uploads/2023/08/Untitled-design-47-300x300.png"
                alt="Lemon Herb Chicken Breast"
                width={400}
                height={250}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-bold text-[rgb(57,67,63)] mb-3 font-[var(--font-bitter)]">
                  Lemon Herb Chicken Breast
                </h3>
                <p className="text-[rgba(57,67,63,0.7)] mb-4 leading-relaxed">
                  Light and flavorful protein perfect for lunch or dinner, featuring herbs and citrus...
                </p>
                <Link href="#" className="text-[rgb(34,119,85)] hover:text-[rgb(25,90,65)] font-semibold">
                  Read Recipe →
                </Link>
              </div>
            </article>
            
            <article className="bg-[rgb(7,18,13,0.06)] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <Image
                src="https://pregnancyplateplanner.com/wp-content/uploads/2023/08/Untitled-design-48-300x300.png"
                alt="Roasted Vegetable Medley"
                width={400}
                height={250}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-bold text-[rgb(57,67,63)] mb-3 font-[var(--font-bitter)]">
                  Roasted Vegetable Medley
                </h3>
                <p className="text-[rgba(57,67,63,0.7)] mb-4 leading-relaxed">
                  Colorful mix of seasonal vegetables roasted to perfection with balanced nutrients...
                </p>
                <Link href="#" className="text-[rgb(34,119,85)] hover:text-[rgb(25,90,65)] font-semibold">
                  Read Recipe →
                </Link>
              </div>
            </article>
            
            <article className="bg-[rgb(7,18,13,0.06)] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <Image
                src="https://pregnancyplateplanner.com/wp-content/uploads/2023/08/Untitled-design-49-300x300.png"
                alt="Quinoa Power Salad"
                width={400}
                height={250}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-bold text-[rgb(57,67,63)] mb-3 font-[var(--font-bitter)]">
                  Quinoa Power Salad
                </h3>
                <p className="text-[rgba(57,67,63,0.7)] mb-4 leading-relaxed">
                  Nutrient-dense salad packed with protein, fiber, and essential minerals...
                </p>
                <Link href="#" className="text-[rgb(34,119,85)] hover:text-[rgb(25,90,65)] font-semibold">
                  Read Recipe →
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Blog Articles Section */}
      <section className="py-20 bg-[rgb(7,18,13,0.06)]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[rgb(57,67,63)] mb-6 font-[var(--font-domine)]">
              Latest Articles & Tips
            </h2>
            <p className="text-xl text-[rgba(57,67,63,0.7)]">
              Evidence-based guidance for managing gestational diabetes with confidence
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <article className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="p-8">
                <div className="w-16 h-16 bg-[rgb(34,119,85)] rounded-full flex items-center justify-center mb-6">
                  <span className="text-2xl">📈</span>
                </div>
                <h3 className="text-xl font-bold text-[rgb(57,67,63)] mb-4 font-[var(--font-bitter)]">
                  Understanding Blood Sugar Spikes
                </h3>
                <p className="text-[rgba(57,67,63,0.7)] mb-4 leading-relaxed">
                  Learn how to identify and manage blood sugar spikes during pregnancy with practical strategies...
                </p>
                <Link href="#" className="text-[rgb(34,119,85)] hover:text-[rgb(25,90,65)] font-semibold">
                  Read More →
                </Link>
              </div>
            </article>
            
            <article className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="p-8">
                <div className="w-16 h-16 bg-[rgb(237,166,2)] rounded-full flex items-center justify-center mb-6">
                  <span className="text-2xl">🍽️</span>
                </div>
                <h3 className="text-xl font-bold text-[rgb(57,67,63)] mb-4 font-[var(--font-bitter)]">
                  Portion Control Made Simple
                </h3>
                <p className="text-[rgba(57,67,63,0.7)] mb-4 leading-relaxed">
                  Master portion sizes for optimal blood sugar control without complicated counting...
                </p>
                <Link href="#" className="text-[rgb(34,119,85)] hover:text-[rgb(25,90,65)] font-semibold">
                  Read More →
                </Link>
              </div>
            </article>
            
            <article className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="p-8">
                <div className="w-16 h-16 bg-[rgb(34,119,85)] rounded-full flex items-center justify-center mb-6">
                  <span className="text-2xl">💪</span>
                </div>
                <h3 className="text-xl font-bold text-[rgb(57,67,63)] mb-4 font-[var(--font-bitter)]">
                  Safe Exercise During GD
                </h3>
                <p className="text-[rgba(57,67,63,0.7)] mb-4 leading-relaxed">
                  Discover pregnancy-safe exercises that help stabilize blood sugar and boost energy...
                </p>
                <Link href="#" className="text-[rgb(34,119,85)] hover:text-[rgb(25,90,65)] font-semibold">
                  Read More →
                </Link>
              </div>
            </article>
          </div>
          
          <div className="text-center mt-12">
            <button className="bg-[rgb(57,67,63)] hover:bg-[rgb(40,50,45)] text-white font-bold py-3 px-6 rounded text-xl transition transform hover:scale-105">
              View All Articles
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[rgb(57,67,63)] text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-xl font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-300 hover:text-white">Home</Link></li>
                <li><Link href="#" className="text-gray-300 hover:text-white">Meal Planner</Link></li>
                <li><Link href="#" className="text-gray-300 hover:text-white">Recipes</Link></li>
                <li><Link href="#" className="text-gray-300 hover:text-white">Blog</Link></li>
                <li><Link href="#" className="text-gray-300 hover:text-white">About Us</Link></li>
                <li><Link href="#" className="text-gray-300 hover:text-white">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-300 hover:text-white">GD Education</Link></li>
                <li><Link href="#" className="text-gray-300 hover:text-white">Meal Planning Guide</Link></li>
                <li><Link href="#" className="text-gray-300 hover:text-white">Recipe Collection</Link></li>
                <li><Link href="#" className="text-gray-300 hover:text-white">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-300 hover:text-white">Privacy Policy</Link></li>
                <li><Link href="#" className="text-gray-300 hover:text-white">Terms of Service</Link></li>
                <li><Link href="#" className="text-gray-300 hover:text-white">Medical Disclaimer</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4">Newsletter</h4>
              <p className="text-gray-300 mb-4">Get weekly GD tips and recipes</p>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Enter email"
                  className="flex-1 px-4 py-2 rounded-l-lg text-black"
                />
                <button className="bg-[rgb(237,166,2)] text-black px-4 py-2 rounded-r-lg font-bold">
                  Subscribe
                </button>
              </div>
              <div className="flex space-x-4 mt-6">
                <Link href="#" className="text-gray-300 hover:text-white">Facebook</Link>
                <Link href="#" className="text-gray-300 hover:text-white">Instagram</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-600 pt-8 text-center text-gray-300">
            <p>&copy; 2025 Pregnancy Plate Planner. All rights reserved. Always consult your healthcare provider.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}